import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { AdminService } from '../admin/admin.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PaymentsService } from '../payments/payments.service';
import { PromosService } from '../promos/promos.service';
import { UserEntity, UserRole } from '../users/entities/user.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingEntity, BookingStatus, PaymentStatus } from './entities/booking.entity';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(BookingEntity)
    private readonly bookingsRepository: Repository<BookingEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    private readonly adminService: AdminService,
    private readonly notificationsService: NotificationsService,
    private readonly paymentsService: PaymentsService,
    private readonly promosService: PromosService,
  ) {}

  async createBooking(customerId: string, dto: CreateBookingDto) {
    const commissionRate = await this.adminService.getEffectiveCommissionRate();
    const promoPreview = dto.promoCode
      ? await this.promosService.previewPromoForBooking(customerId, dto.promoCode, dto.quotedPriceCents)
      : null;
    const discountCents = promoPreview?.discountCents ?? 0;
    const finalPriceCents = dto.quotedPriceCents - discountCents;
    const commissionCents = Math.round(finalPriceCents * commissionRate);

    const booking = this.bookingsRepository.create({
      ...dto,
      customerId,
      bookingRef: this.generateBookingRef(),
      promoCode: promoPreview?.promo.code ?? null,
      discountCents,
      finalPriceCents,
      commissionCents,
      providerEarningsCents: finalPriceCents - commissionCents,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
    });

    const savedBooking = await this.bookingsRepository.save(booking);

    if (promoPreview) {
      await this.promosService.consumePromoForBooking({
        userId: customerId,
        bookingId: savedBooking.id,
        promoId: promoPreview.promo.id,
        discountCents,
      });
    }

    await this.notificationsService.createNotification({
      userId: customerId,
      title: 'Booking requested',
      body: `Your ${savedBooking.bookingRef} request has been placed and is waiting for a provider.`,
      type: 'booking_created',
      payload: { bookingId: savedBooking.id, bookingRef: savedBooking.bookingRef },
    });

    return savedBooking;
  }

  async listMyBookings(userId: string, role: UserRole) {
    if (role === UserRole.PROVIDER) {
      return this.bookingsRepository.find({
        where: { providerId: userId },
        order: { createdAt: 'DESC' },
      });
    }

    return this.bookingsRepository.find({
      where: { customerId: userId },
      order: { createdAt: 'DESC' },
    });
  }

  async listAvailableForProviders(providerId: string) {
    const bookings = await this.bookingsRepository.find({
      where: { status: BookingStatus.PENDING, providerId: IsNull() },
      order: { createdAt: 'ASC' },
    });

    return bookings.filter(
      (booking) => !(booking.declinedByProviderIds ?? []).includes(providerId),
    );
  }

  async acceptBooking(bookingId: string, providerId: string) {
    const provider = await this.usersRepository.findOne({ where: { id: providerId } });
    if (!provider || provider.role !== UserRole.PROVIDER) {
      throw new ForbiddenException('Only providers can accept bookings');
    }

    const booking = await this.bookingsRepository.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== BookingStatus.PENDING || booking.providerId) {
      throw new ForbiddenException('Booking is no longer available');
    }

    booking.providerId = providerId;
    booking.status = BookingStatus.ACCEPTED;
    booking.acceptedAt = new Date();
    const savedBooking = await this.bookingsRepository.save(booking);

    await this.notificationsService.createNotification({
      userId: booking.customerId,
      title: 'Provider assigned',
      body: `A provider accepted booking ${booking.bookingRef}. They can now share live updates.`,
      type: 'booking_accepted',
      payload: { bookingId: booking.id, bookingRef: booking.bookingRef },
    });

    await this.notificationsService.createNotification({
      userId: providerId,
      title: 'Booking accepted',
      body: `You are now assigned to booking ${booking.bookingRef}.`,
      type: 'provider_booking_assigned',
      payload: { bookingId: booking.id, bookingRef: booking.bookingRef },
    });

    return savedBooking;
  }

  async declineBooking(bookingId: string, providerId: string, reason: string) {
    const provider = await this.usersRepository.findOne({ where: { id: providerId } });
    if (!provider || provider.role !== UserRole.PROVIDER) {
      throw new ForbiddenException('Only providers can decline bookings');
    }

    const booking = await this.bookingsRepository.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== BookingStatus.PENDING || booking.providerId) {
      throw new ForbiddenException('Booking is no longer available');
    }

    const declinedByProviderIds = [...(booking.declinedByProviderIds ?? [])];
    if (!declinedByProviderIds.includes(providerId)) {
      declinedByProviderIds.push(providerId);
    }

    booking.declinedByProviderIds = declinedByProviderIds;
    booking.providerNotes = (booking.providerNotes?.trim().length ?? 0) > 0
      ? '${booking.providerNotes}\nDeclined by provider ${providerId}: ${reason}'
      : `Declined by provider ${providerId}: ${reason}`;

    return this.bookingsRepository.save(booking);
  }

  async updateStatus(bookingId: string, providerId: string, status: BookingStatus) {
    const booking = await this.bookingsRepository.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.providerId !== providerId) {
      throw new ForbiddenException('Only the assigned provider can update this booking');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Cancelled bookings cannot be updated');
    }

    booking.status = status;
    const now = new Date();

    switch (status) {
      case BookingStatus.EN_ROUTE:
        booking.enRouteAt = now;
        break;
      case BookingStatus.ARRIVED:
        booking.arrivedAt = now;
        break;
      case BookingStatus.IN_PROGRESS:
        booking.startedAt = now;
        break;
      case BookingStatus.COMPLETED:
        booking.completedAt = now;
        await this.paymentsService.settleBookingCompletion(booking, {
          actorId: providerId,
          actorRole: UserRole.PROVIDER,
        });
        booking.paymentStatus = PaymentStatus.PAID;
        break;
      default:
        break;
    }

    const savedBooking = await this.bookingsRepository.save(booking);

    const customerMessage = this.getCustomerNotificationForStatus(savedBooking.status, savedBooking.bookingRef);
    if (customerMessage != null) {
      await this.notificationsService.createNotification({
        userId: savedBooking.customerId,
        title: customerMessage.title,
        body: customerMessage.body,
        type: customerMessage.type,
        payload: { bookingId: savedBooking.id, bookingRef: savedBooking.bookingRef },
      });
    }

    return savedBooking;
  }

  async updateProviderLocation(
    bookingId: string,
    providerId: string,
    coords: { latitude: number; longitude: number },
  ) {
    const booking = await this.bookingsRepository.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.providerId !== providerId) {
      throw new ForbiddenException('Only the assigned provider can share live tracking for this booking');
    }

    if ([BookingStatus.CANCELLED, BookingStatus.COMPLETED].includes(booking.status)) {
      throw new BadRequestException('Live tracking is only available for active bookings');
    }

    booking.providerCurrentLat = coords.latitude;
    booking.providerCurrentLng = coords.longitude;
    booking.providerLocationUpdatedAt = new Date();
    return this.bookingsRepository.save(booking);
  }

  async cancelBooking(bookingId: string, actorId: string, reason: string) {
    const booking = await this.bookingsRepository.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');

    const canCancel = booking.customerId === actorId || booking.providerId === actorId;
    if (!canCancel) {
      throw new ForbiddenException('Only the customer or assigned provider can cancel');
    }

    if ([BookingStatus.COMPLETED, BookingStatus.CANCELLED].includes(booking.status)) {
      throw new ForbiddenException('This booking can no longer be cancelled');
    }

    booking.status = BookingStatus.CANCELLED;
    booking.cancelledAt = new Date();
    booking.cancelReason = reason;
    booking.cancelledBy = actorId;
    const savedBooking = await this.bookingsRepository.save(booking);
    const otherPartyId = booking.customerId === actorId ? booking.providerId : booking.customerId;

    if (otherPartyId) {
      await this.notificationsService.createNotification({
        userId: otherPartyId,
        title: 'Booking cancelled',
        body: `Booking ${booking.bookingRef} was cancelled. Reason: ${reason}`,
        type: 'booking_cancelled',
        payload: { bookingId: booking.id, bookingRef: booking.bookingRef },
      });
    }

    return savedBooking;
  }

  private generateBookingRef() {
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `KZ-${Date.now()}-${suffix}`;
  }

  private getCustomerNotificationForStatus(status: BookingStatus, bookingRef: string) {
    switch (status) {
      case BookingStatus.EN_ROUTE:
        return {
          title: 'Provider is en route',
          body: `Your provider is on the way for booking ${bookingRef}.`,
          type: 'booking_en_route',
        };
      case BookingStatus.ARRIVED:
        return {
          title: 'Provider has arrived',
          body: `Your provider has arrived for booking ${bookingRef}.`,
          type: 'booking_arrived',
        };
      case BookingStatus.IN_PROGRESS:
        return {
          title: 'Service in progress',
          body: `Booking ${bookingRef} is now in progress.`,
          type: 'booking_in_progress',
        };
      case BookingStatus.COMPLETED:
        return {
          title: 'Booking completed',
          body: `Booking ${bookingRef} has been completed successfully.`,
          type: 'booking_completed',
        };
      default:
        return null;
    }
  }
}