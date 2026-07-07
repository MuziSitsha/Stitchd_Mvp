import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import { Repository } from 'typeorm';
import { AdminService } from '../admin/admin.service';
import { WeddingEventEntity } from '../planner/entities/wedding-event.entity';
import { WeddingVendorPaymentEntity } from '../planner/entities/wedding-vendor-payment.entity';
import { WeddingVendorSelectionEntity } from '../planner/entities/wedding-vendor-selection.entity';
import { UserEntity, UserRole } from '../users/entities/user.entity';
import { InitiateVendorPaymentDto } from './dto/initiate-vendor-payment.dto';
import { PaymentStatus } from './payment-status.enum';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(WeddingVendorPaymentEntity)
    private readonly vendorPaymentsRepository: Repository<WeddingVendorPaymentEntity>,
    @InjectRepository(WeddingVendorSelectionEntity)
    private readonly vendorSelectionsRepository: Repository<WeddingVendorSelectionEntity>,
    @InjectRepository(WeddingEventEntity)
    private readonly weddingEventsRepository: Repository<WeddingEventEntity>,
    private readonly adminService: AdminService,
  ) {}

  async initiateVendorPaymentCheckout(
    selectionId: string,
    actor: { id: string; role: UserRole },
    dto: InitiateVendorPaymentDto,
  ) {
    const selection = await this.vendorSelectionsRepository.findOne({ where: { id: selectionId } });
    if (!selection) throw new NotFoundException('Vendor selection not found');

    const event = await this.weddingEventsRepository.findOne({ where: { id: selection.weddingEventId } });
    if (!event) throw new NotFoundException('Wedding event not found');
    this.assertActorCanAccessVendorPayment(event, actor);

    const remainingCents = Math.max(selection.priceCents - selection.amountPaidCents, 0);
    if (remainingCents <= 0) {
      throw new BadRequestException('This vendor is already paid in full');
    }
    const amountCents = dto.amountCents ? Math.min(dto.amountCents, remainingCents) : remainingCents;

    const merchantId = this.configService.get<string>('app.payfastMerchantId');
    const merchantKey = this.configService.get<string>('app.payfastMerchantKey');
    if (!merchantId || !merchantKey) {
      throw new ForbiddenException('PayFast is not configured for this environment');
    }

    const commissionRate = await this.adminService.getEffectiveCommissionRate();
    const commissionCents = Math.round(amountCents * commissionRate);

    const payment = await this.vendorPaymentsRepository.save(
      this.vendorPaymentsRepository.create({
        vendorSelectionId: selection.id,
        weddingEventId: event.id,
        customerId: event.ownerUserId,
        amountCents,
        commissionCents,
      }),
    );

    const customer = await this.usersRepository.findOne({ where: { id: event.ownerUserId } });
    const merchantTransactionId = `vendor:${payment.id}`;
    const checkoutUrl = this.buildPayfastCheckout({
      merchantId,
      merchantKey,
      merchantTransactionId,
      amountCents,
      customer,
      fallbackCustomerId: event.ownerUserId,
      itemName: selection.vendorName || 'STITCHD vendor payment',
      itemDescription: `Payment toward ${selection.vendorName} (${selection.slot})`,
      returnUrl: dto.returnUrl || `${this.getPublicApiUrl()}/api/v1/payments/checkout/result`,
      customStr1: 'wedding_vendor_payment',
      customStr2: selection.id,
      customStr3: event.ownerUserId,
    });

    payment.checkoutId = merchantTransactionId;
    payment.checkoutUrl = checkoutUrl;
    payment.gatewayReference = merchantTransactionId;
    const savedPayment = await this.vendorPaymentsRepository.save(payment);

    return {
      selectionId: selection.id,
      paymentId: savedPayment.id,
      status: savedPayment.status,
      checkoutId: savedPayment.checkoutId,
      checkoutUrl,
      amountCents,
      commissionCents,
    };
  }

  async getVendorPayment(selectionId: string, actor: { id: string; role: UserRole }) {
    const selection = await this.vendorSelectionsRepository.findOne({ where: { id: selectionId } });
    if (!selection) throw new NotFoundException('Vendor selection not found');

    const event = await this.weddingEventsRepository.findOne({ where: { id: selection.weddingEventId } });
    if (!event) throw new NotFoundException('Wedding event not found');
    this.assertActorCanAccessVendorPayment(event, actor);

    return this.vendorPaymentsRepository.findOne({
      where: { vendorSelectionId: selectionId },
      order: { createdAt: 'DESC' },
    });
  }

  async confirmPayfastWebhook(payload: Record<string, unknown>) {
    const merchantTransactionId = this.getString(payload, 'm_payment_id');
    if (!merchantTransactionId || !merchantTransactionId.startsWith('vendor:')) {
      return { received: true, ignored: true };
    }

    return this.confirmVendorPaymentWebhook(merchantTransactionId.slice('vendor:'.length), payload);
  }

  private async confirmVendorPaymentWebhook(paymentId: string, payload: Record<string, unknown>) {
    const payment = await this.vendorPaymentsRepository.findOne({ where: { id: paymentId } });
    if (!payment || payment.status === PaymentStatus.PAID) {
      return { received: true, ignored: true };
    }

    const transactionId = this.getString(payload, 'pf_payment_id') || payment.checkoutId || payment.gatewayReference;
    const paymentStatus = this.getString(payload, 'payment_status');
    const isSuccess = paymentStatus === 'COMPLETE';

    if (isSuccess) {
      payment.status = PaymentStatus.PAID;
      payment.gatewayReference = transactionId;
      payment.note = 'PayFast webhook confirmed payment';
      payment.settledAt = new Date();
      await this.vendorPaymentsRepository.save(payment);

      const selection = await this.vendorSelectionsRepository.findOne({ where: { id: payment.vendorSelectionId } });
      if (selection) {
        selection.amountPaidCents += payment.amountCents;
        selection.paidAt = selection.priceCents > 0 && selection.amountPaidCents >= selection.priceCents
          ? new Date()
          : null;
        await this.vendorSelectionsRepository.save(selection);
      }

      return { received: true, status: PaymentStatus.PAID };
    }

    payment.status = PaymentStatus.FAILED;
    payment.gatewayReference = transactionId;
    payment.note = paymentStatus || 'PayFast webhook reported payment failure';
    await this.vendorPaymentsRepository.save(payment);

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
      <p>Your PayFast payment request has been handed back to STITCHD. You can return to the app and refresh your wedding budget.</p>
      ${transactionId ? `<p><strong>Transaction:</strong> <code>${transactionId}</code></p>` : ''}
      ${resourcePath ? `<p><strong>Resource:</strong> <code>${resourcePath}</code></p>` : ''}
    </main>
  </body>
</html>`;
  }

  private assertActorCanAccessVendorPayment(
    event: WeddingEventEntity,
    actor: { id: string; role: UserRole },
  ) {
    if (actor.role === UserRole.ADMIN) return;
    if (event.ownerUserId === actor.id) return;
    throw new ForbiddenException('You do not have access to this wedding event payment');
  }

  private buildPayfastCheckout(options: {
    merchantId: string;
    merchantKey: string;
    merchantTransactionId: string;
    amountCents: number;
    customer: UserEntity | null;
    fallbackCustomerId: string;
    itemName: string;
    itemDescription: string;
    returnUrl: string;
    customStr1: string;
    customStr2: string;
    customStr3: string;
  }) {
    const {
      merchantId,
      merchantKey,
      merchantTransactionId,
      amountCents,
      customer,
      fallbackCustomerId,
      itemName,
      itemDescription,
      returnUrl,
      customStr1,
      customStr2,
      customStr3,
    } = options;

    const baseUrl = this.getPayfastBaseUrl();
    const notificationUrl = `${this.getPublicApiUrl()}/api/v1/payments/webhooks/payfast`;
    const cancelUrl = `${this.getPublicApiUrl()}/api/v1/payments/checkout/result?status=cancelled`;
    const paymentPayload = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      notify_url: notificationUrl,
      name_first: customer?.firstName || 'STITCHD',
      name_last: customer?.lastName || 'Customer',
      email_address: customer?.email || `${fallbackCustomerId}@stitchd.local`,
      m_payment_id: merchantTransactionId,
      amount: (amountCents / 100).toFixed(2),
      item_name: itemName,
      item_description: itemDescription,
      custom_str1: customStr1,
      custom_str2: customStr2,
      custom_str3: customStr3,
    };
    const signature = this.createPayfastSignature(paymentPayload);
    return `${baseUrl}/eng/process?${this.createPayfastQueryString({
      ...paymentPayload,
      signature,
    })}`;
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
    // PayFast requires the signature to be computed over the fields in the
    // same order they're actually submitted (not sorted alphabetically) -
    // this must match createPayfastQueryString's ordering exactly, since
    // PayFast recomputes the hash over the query string as received.
    const filtered = Object.entries(payload)
      .filter(([, value]) => value.trim().length > 0);
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
