import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import crypto from 'crypto';
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

    if (![PaymentMethod.CARD, PaymentMethod.EFT, PaymentMethod.PAYFAST].includes(booking.paymentMethod)) {
      throw new ForbiddenException('Hosted checkout is only available for PayFast-backed online payments');
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

    const merchantId = this.configService.get<string>('app.payfastMerchantId');
    const merchantKey = this.configService.get<string>('app.payfastMerchantKey');
    if (!merchantId || !merchantKey) {
      throw new ForbiddenException('PayFast is not configured for this environment');
    }

    const payment = await this.ensurePaymentRecord(booking);
    const customer = await this.usersRepository.findOne({ where: { id: booking.customerId } });
    const amountCents = payment.amountCents || booking.finalPriceCents || booking.quotedPriceCents;
    const amount = (amountCents / 100).toFixed(2);
    const baseUrl = this.getPayfastBaseUrl();
    const merchantTransactionId = booking.id;
    const notificationUrl = `${this.getPublicApiUrl()}/api/v1/payments/webhooks/payfast`;
    const returnUrl = dto.returnUrl || `${this.getPublicApiUrl()}/api/v1/payments/checkout/result`;
    const cancelUrl = `${this.getPublicApiUrl()}/api/v1/payments/checkout/result?status=cancelled`;
    const itemName = booking.bookingRef || 'STITCHD booking';
    const paymentPayload = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      notify_url: notificationUrl,
      name_first: customer?.firstName || 'STITCHD',
      name_last: customer?.lastName || 'Customer',
      email_address: customer?.email || `${booking.customerId}@stitchd.local`,
      m_payment_id: merchantTransactionId,
      amount,
      item_name: itemName,
      item_description: `Payment for booking ${booking.bookingRef}`,
      custom_str1: booking.paymentMethod,
      custom_str2: booking.customerId,
      custom_str3: booking.providerId || '',
    };
    const signature = this.createPayfastSignature(paymentPayload);
    const checkoutUrl = `${baseUrl}/eng/process?${this.createPayfastQueryString({
      ...paymentPayload,
      signature,
    })}`;

    payment.checkoutId = merchantTransactionId;
    payment.checkoutUrl = checkoutUrl;
    payment.gatewayReference = merchantTransactionId;
    payment.note = `PayFast checkout created for ${booking.paymentMethod}`;
    booking.paymentGatewayRef = merchantTransactionId;

    await this.bookingsRepository.save(booking);
    const savedPayment = await this.paymentsRepository.save(payment);

    return {
      bookingId: booking.id,
      paymentId: savedPayment.id,
      paymentMethod: booking.paymentMethod,
      status: savedPayment.status,
      checkoutId: savedPayment.checkoutId,
      checkoutUrl,
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

  async confirmPayfastWebhook(payload: Record<string, unknown>) {
    const merchantTransactionId = this.getString(payload, 'm_payment_id');
    if (!merchantTransactionId) {
      return { received: true, ignored: true };
    }

    const booking = await this.bookingsRepository.findOne({ where: { id: merchantTransactionId } });
    if (!booking) {
      return { received: true, ignored: true };
    }

    const payment = await this.ensurePaymentRecord(booking);
    const transactionId = this.getString(payload, 'pf_payment_id') || payment.checkoutId || payment.gatewayReference;
    const paymentStatus = this.getString(payload, 'payment_status');
    const isSuccess = paymentStatus === 'COMPLETE';

    if (isSuccess) {
      await this.settleBookingCompletion(booking, {
        actorId: 'system-payfast',
        actorRole: UserRole.ADMIN,
        gatewayReference: transactionId,
        note: 'PayFast webhook confirmed payment',
      });
      return { received: true, status: PaymentStatus.PAID };
    }

    payment.status = PaymentStatus.FAILED;
    payment.gatewayReference = transactionId;
    payment.note = paymentStatus || 'PayFast webhook reported payment failure';
    booking.paymentStatus = PaymentStatus.FAILED;

    await this.bookingsRepository.save(booking);
    await this.paymentsRepository.save(payment);

    return { received: true, status: PaymentStatus.FAILED };
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
    <title>STITCHD Payment Status</title>
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
      <p>Your PayFast payment request has been handed back to STITCHD. You can return to the app and refresh the booking status.</p>
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

  private getPayfastBaseUrl() {
    const mode = this.configService.get<string>('app.payfastMode');
    return mode === 'live' ? 'https://www.payfast.co.za' : 'https://sandbox.payfast.co.za';
  }

  private getPublicApiUrl() {
    return (this.configService.get<string>('app.publicApiUrl') || 'http://localhost:3001').replace(/\/$/, '');
  }

  private createPayfastQueryString(payload: Record<string, string>) {
    return Object.entries(payload)
      .filter(([, value]) => value.trim().length > 0)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value.trim())}`)
      .join('&');
  }

  private createPayfastSignature(payload: Record<string, string>) {
    const filtered = Object.entries(payload)
      .filter(([, value]) => value.trim().length > 0)
      .sort(([left], [right]) => left.localeCompare(right));
    const phrase = this.configService.get<string>('app.payfastPassphrase')?.trim();
    const serialized = filtered
      .map(([key, value]) => `${key}=${encodeURIComponent(value.trim()).replace(/%20/g, '+')}`)
      .join('&');
    const toSign = phrase ? `${serialized}&passphrase=${encodeURIComponent(phrase).replace(/%20/g, '+')}` : serialized;
    return crypto.createHash('md5').update(toSign).digest('hex');
  }

  private getString(payload: Record<string, unknown>, key: string) {
    const value = payload[key];
    return typeof value === 'string' && value.length > 0 ? value : undefined;
  }

}