import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { Repository } from 'typeorm';
import {
  BookingEntity,
  BookingStatus,
  PaymentMethod,
  PaymentStatus,
} from '../bookings/entities/booking.entity';
import { UserEntity, UserRole } from '../users/entities/user.entity';
import {
  WalletReferenceType,
  WalletTransactionDirection,
} from '../wallet/entities/wallet-transaction.entity';
import { WalletService } from '../wallet/wallet.service';
import { InitiateBookingPaymentDto } from './dto/initiate-booking-payment.dto';
import { PaymentTransactionEntity } from './entities/payment-transaction.entity';

type SettlementActor = {
  actorId: string;
  actorRole: UserRole;
  gatewayReference?: string;
  note?: string;
};

@Injectable()
export class PaymentsService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(PaymentTransactionEntity)
    private readonly paymentsRepository: Repository<PaymentTransactionEntity>,
    @InjectRepository(BookingEntity)
    private readonly bookingsRepository: Repository<BookingEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    private readonly walletService: WalletService,
  ) {}

  async listMyPayments(userId: string, role: UserRole) {
    const where = role === UserRole.PROVIDER ? { providerId: userId } : { customerId: userId };
    return this.paymentsRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async getBookingPayment(bookingId: string, actorId: string, actorRole: UserRole) {
    const booking = await this.bookingsRepository.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');
    this.assertActorCanAccessBooking(booking, actorId, actorRole);

    return this.paymentsRepository.findOne({ where: { bookingId } });
  }

  async settleBooking(bookingId: string, actor: SettlementActor) {
    const booking = await this.bookingsRepository.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');
    this.assertActorCanAccessBooking(booking, actor.actorId, actor.actorRole);
    return this.settleBookingCompletion(booking, actor);
  }

  async initiateHostedCheckout(
    bookingId: string,
    actor: { id: string; role: UserRole },
    dto: InitiateBookingPaymentDto,
  ) {
    const booking = await this.bookingsRepository.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');
    this.assertActorCanAccessBooking(booking, actor.id, actor.role);

    if (![PaymentMethod.CARD, PaymentMethod.EFT].includes(booking.paymentMethod)) {
      throw new ForbiddenException('Hosted checkout is only available for card and EFT bookings');
    }

    if (booking.paymentStatus === PaymentStatus.PAID) {
      const settledPayment = await this.paymentsRepository.findOne({ where: { bookingId } });
      return {
        bookingId,
        paymentId: settledPayment?.id,
        status: PaymentStatus.PAID,
        checkoutUrl: settledPayment?.checkoutUrl,
      };
    }

    const entityId = this.configService.get<string>('app.peachPaymentsEntityId');
    const secret = this.configService.get<string>('app.peachPaymentsSecret');
    if (!entityId || !secret) {
      throw new ForbiddenException('Peach Payments is not configured for this environment');
    }

    const payment = await this.ensurePaymentRecord(booking);
    const customer = await this.usersRepository.findOne({ where: { id: booking.customerId } });
    const amountCents = payment.amountCents || booking.finalPriceCents || booking.quotedPriceCents;
    const amount = (amountCents / 100).toFixed(2);
    const baseUrl = this.getPeachBaseUrl();
    const merchantTransactionId = booking.id;
    const notificationUrl = `${this.getPublicApiUrl()}/api/v1/payments/webhooks/peach`;
    const returnUrl = dto.returnUrl || `${this.getPublicApiUrl()}/api/v1/payments/checkout/result`;
    const params = new URLSearchParams({
      entityId,
      amount,
      currency: 'ZAR',
      paymentType: 'DB',
      merchantTransactionId,
      notificationUrl,
      shopperResultUrl: returnUrl,
      'billing.country': 'ZA',
      'billing.city': 'Johannesburg',
      'customer.givenName': customer?.firstName || 'KAZI',
      'customer.surname': customer?.lastName || 'Customer',
      'customer.email': customer?.email || `${booking.customerId}@kazi.local`,
    });

    const response = await axios.post(`${baseUrl}/v1/checkouts`, params, {
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 15000,
    });

    const checkoutId = response.data?.id as string | undefined;
    if (!checkoutId) {
      throw new ForbiddenException('Peach Payments did not return a checkout session');
    }

    payment.checkoutId = checkoutId;
    payment.checkoutUrl = `${this.getPublicApiUrl()}/api/v1/payments/checkout/${checkoutId}`;
    payment.gatewayReference = checkoutId;
    payment.note = `Hosted checkout created for ${booking.paymentMethod}`;
    booking.paymentGatewayRef = checkoutId;

    await this.bookingsRepository.save(booking);
    const savedPayment = await this.paymentsRepository.save(payment);

    return {
      bookingId: booking.id,
      paymentId: savedPayment.id,
      paymentMethod: booking.paymentMethod,
      status: savedPayment.status,
      checkoutId,
      checkoutUrl: savedPayment.checkoutUrl,
      amountCents,
    };
  }

  async settleBookingCompletion(booking: BookingEntity, actor: SettlementActor) {
    if (booking.status === BookingStatus.CANCELLED) {
      throw new ForbiddenException('Cancelled bookings cannot be settled');
    }

    let payment = await this.paymentsRepository.findOne({ where: { bookingId: booking.id } });
    if (payment?.status === PaymentStatus.PAID) {
      return payment;
    }

    if (!payment) {
      payment = this.paymentsRepository.create({
        bookingId: booking.id,
        customerId: booking.customerId,
        providerId: booking.providerId,
        paymentMethod: booking.paymentMethod,
        amountCents: booking.finalPriceCents || booking.quotedPriceCents,
        commissionCents: booking.commissionCents,
        providerEarningsCents: booking.providerEarningsCents,
      });
      payment = await this.paymentsRepository.save(payment);
    }

    if (booking.paymentMethod === PaymentMethod.WALLET) {
      await this.walletService.recordTransaction({
        userId: booking.customerId,
        direction: WalletTransactionDirection.DEBIT,
        amountCents: payment.amountCents,
        referenceType: WalletReferenceType.BOOKING_PAYMENT,
        referenceId: booking.id,
        bookingId: booking.id,
        paymentTransactionId: payment.id,
        description: `Wallet payment for booking ${booking.bookingRef}`,
      });
    }

    if (booking.providerId && booking.providerEarningsCents > 0) {
      await this.walletService.recordTransaction({
        userId: booking.providerId,
        direction: WalletTransactionDirection.CREDIT,
        amountCents: booking.providerEarningsCents,
        referenceType: WalletReferenceType.PROVIDER_EARNING,
        referenceId: booking.id,
        bookingId: booking.id,
        paymentTransactionId: payment.id,
        description: `Provider earnings for booking ${booking.bookingRef}`,
      });
    }

    payment.status = PaymentStatus.PAID;
    payment.gatewayReference = actor.gatewayReference;
    payment.note = actor.note;
    payment.providerId = booking.providerId;
    payment.settledAt = new Date();

    booking.paymentStatus = PaymentStatus.PAID;
    await this.bookingsRepository.save(booking);
    return this.paymentsRepository.save(payment);
  }

  async confirmPeachWebhook(payload: Record<string, unknown>) {
    const merchantTransactionId = this.getString(payload, 'merchantTransactionId');
    if (!merchantTransactionId) {
      return { received: true, ignored: true };
    }

    const booking = await this.bookingsRepository.findOne({ where: { id: merchantTransactionId } });
    if (!booking) {
      return { received: true, ignored: true };
    }

    const payment = await this.ensurePaymentRecord(booking);
    const transactionId = this.getString(payload, 'id') || payment.checkoutId || payment.gatewayReference;
    const resultCode = this.getNestedString(payload, ['result', 'code']) || this.getString(payload, 'result.code');
    const resultDescription =
      this.getNestedString(payload, ['result', 'description']) || this.getString(payload, 'result.description');
    const isSuccess = this.isSuccessfulPeachResult(resultCode);

    if (isSuccess) {
      await this.settleBookingCompletion(booking, {
        actorId: 'system-peach',
        actorRole: UserRole.ADMIN,
        gatewayReference: transactionId,
        note: resultDescription || 'Peach webhook confirmed payment',
      });
      return { received: true, status: PaymentStatus.PAID };
    }

    payment.status = PaymentStatus.FAILED;
    payment.gatewayReference = transactionId;
    payment.note = resultDescription || resultCode || 'Peach webhook reported payment failure';
    booking.paymentStatus = PaymentStatus.FAILED;

    await this.bookingsRepository.save(booking);
    await this.paymentsRepository.save(payment);

    return { received: true, status: PaymentStatus.FAILED };
  }

  async getHostedCheckoutHtml(checkoutId: string) {
    const payment = await this.paymentsRepository.findOne({ where: { checkoutId } });
    if (!payment?.checkoutId) {
      throw new NotFoundException('Hosted checkout session not found');
    }

    const entityId = this.configService.get<string>('app.peachPaymentsEntityId');
    if (!entityId) {
      throw new ForbiddenException('Peach Payments is not configured for this environment');
    }

    const baseUrl = this.getPeachBaseUrl();
    const resultUrl = `${this.getPublicApiUrl()}/api/v1/payments/checkout/result`;

    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>KAZI Secure Payment</title>
    <script src="${baseUrl}/v1/paymentWidgets.js?checkoutId=${payment.checkoutId}"></script>
    <style>
      body { font-family: Arial, sans-serif; background: #f6f7f4; color: #111111; margin: 0; padding: 24px; }
      main { max-width: 720px; margin: 0 auto; background: #ffffff; border-radius: 24px; padding: 32px; box-shadow: 0 12px 40px rgba(0,0,0,0.08); }
      h1 { margin-top: 0; color: #006b3c; }
      p { line-height: 1.5; }
      .meta { margin: 16px 0 24px; padding: 16px; border-radius: 16px; background: #f6f7f4; }
    </style>
  </head>
  <body>
    <main>
      <h1>KAZI secure checkout</h1>
      <p>Complete your ${payment.paymentMethod.toUpperCase()} payment to confirm the booking.</p>
      <div class="meta">
        <strong>Amount:</strong> R${(payment.amountCents / 100).toFixed(2)}<br />
        <strong>Booking:</strong> ${payment.bookingId}
      </div>
      <form action="${resultUrl}" class="paymentWidgets" data-brands="VISA MASTER EFT_SECURE"></form>
    </main>
  </body>
</html>`;
  }

  getCheckoutResultHtml({
    transactionId,
    resourcePath,
  }: {
    transactionId?: string;
    resourcePath?: string;
  }) {
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>KAZI Payment Status</title>
    <style>
      body { font-family: Arial, sans-serif; background: #f6f7f4; color: #111111; margin: 0; padding: 24px; }
      main { max-width: 720px; margin: 0 auto; background: #ffffff; border-radius: 24px; padding: 32px; box-shadow: 0 12px 40px rgba(0,0,0,0.08); }
      h1 { margin-top: 0; color: #006b3c; }
      code { display: inline-block; margin-top: 8px; word-break: break-all; }
    </style>
  </head>
  <body>
    <main>
      <h1>Payment submitted</h1>
      <p>Your payment request has been handed back to KAZI. You can return to the app and refresh the booking status.</p>
      ${transactionId ? `<p><strong>Transaction:</strong> <code>${transactionId}</code></p>` : ''}
      ${resourcePath ? `<p><strong>Resource:</strong> <code>${resourcePath}</code></p>` : ''}
    </main>
  </body>
</html>`;
  }

  private assertActorCanAccessBooking(
    booking: BookingEntity,
    actorId: string,
    actorRole: UserRole,
  ) {
    if (actorRole === UserRole.ADMIN) return;
    if (booking.customerId === actorId || booking.providerId === actorId) return;
    throw new ForbiddenException('You do not have access to this booking payment');
  }

  private async ensurePaymentRecord(booking: BookingEntity) {
    let payment = await this.paymentsRepository.findOne({ where: { bookingId: booking.id } });
    if (payment) {
      return payment;
    }

    payment = this.paymentsRepository.create({
      bookingId: booking.id,
      customerId: booking.customerId,
      providerId: booking.providerId,
      paymentMethod: booking.paymentMethod,
      amountCents: booking.finalPriceCents || booking.quotedPriceCents,
      commissionCents: booking.commissionCents,
      providerEarningsCents: booking.providerEarningsCents,
    });
    return this.paymentsRepository.save(payment);
  }

  private getPeachBaseUrl() {
    const mode = this.configService.get<string>('app.peachPaymentsMode');
    return mode === 'live' ? 'https://oppwa.com' : 'https://test.oppwa.com';
  }

  private getPublicApiUrl() {
    return (this.configService.get<string>('app.publicApiUrl') || 'http://localhost:3001').replace(/\/$/, '');
  }

  private isSuccessfulPeachResult(code?: string | null) {
    if (!code) return false;
    return /^000\.000\./.test(code) || /^000\.100\.1/.test(code) || /^000\.[36]/.test(code);
  }

  private getString(payload: Record<string, unknown>, key: string) {
    const value = payload[key];
    return typeof value === 'string' && value.length > 0 ? value : undefined;
  }

  private getNestedString(payload: Record<string, unknown>, path: string[]) {
    let current: unknown = payload;
    for (const segment of path) {
      if (typeof current !== 'object' || current === null || !(segment in current)) {
        return undefined;
      }
      current = (current as Record<string, unknown>)[segment];
    }

    return typeof current === 'string' && current.length > 0 ? current : undefined;
  }
}