import { BookingType, PaymentMethod } from './entities/booking.entity';
import { BookingsService } from './bookings.service';

describe('BookingsService', () => {
  function createRepositoryMock() {
    return {
      create: jest.fn((value) => value),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
    };
  }

  it('creates a booking with commission, provider earnings, promo consumption, and notification', async () => {
    const bookingsRepository = createRepositoryMock();
    const usersRepository = createRepositoryMock();
    const adminService = {
      getEffectiveCommissionRate: jest.fn().mockResolvedValue(0.15),
    };
    const notificationsService = {
      createNotification: jest.fn().mockResolvedValue(undefined),
    };
    const paymentsService = {
      settleBookingCompletion: jest.fn(),
    };
    const promosService = {
      previewPromoForBooking: jest.fn().mockResolvedValue({
        promo: { id: 'promo-1', code: 'WELCOME20' },
        discountCents: 2_000,
      }),
      consumePromoForBooking: jest.fn().mockResolvedValue(undefined),
    };
    const service = new BookingsService(
      bookingsRepository as never,
      usersRepository as never,
      adminService as never,
      notificationsService as never,
      paymentsService as never,
      promosService as never,
    );

    bookingsRepository.save.mockImplementation(async (value) => ({
      id: 'booking-1',
      ...value,
    }));

    const result = await service.createBooking('customer-1', {
      serviceCategoryId: 'cat-1',
      serviceId: 'svc-1',
      type: BookingType.INSTANT,
      paymentMethod: PaymentMethod.CARD,
      quotedPriceCents: 10_000,
      customerAddress: 'Sandton, Johannesburg',
      promoCode: 'welcome20',
    } as never);

    expect(result).toEqual(
      expect.objectContaining({
        customerId: 'customer-1',
        finalPriceCents: 8_000,
        commissionCents: 1_200,
        providerEarningsCents: 6_800,
        discountCents: 2_000,
        promoCode: 'WELCOME20',
      }),
    );

    expect(promosService.consumePromoForBooking).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'customer-1',
        bookingId: 'booking-1',
        promoId: 'promo-1',
        discountCents: 2_000,
      }),
    );
    expect(notificationsService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'customer-1',
        type: 'booking_created',
        payload: expect.objectContaining({ bookingId: 'booking-1' }),
      }),
    );
  });
});