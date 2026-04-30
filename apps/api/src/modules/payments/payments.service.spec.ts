import { UserRole } from '../users/entities/user.entity';
import { BookingEntity, BookingStatus, PaymentMethod, PaymentStatus } from '../bookings/entities/booking.entity';
import { WalletReferenceType, WalletTransactionDirection } from '../wallet/entities/wallet-transaction.entity';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  function createRepositoryMock() {
    return {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      create: jest.fn((value) => value),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
  }

  it('settles a wallet booking, records both ledger entries, and marks the booking paid', async () => {
    const paymentsRepository = createRepositoryMock();
    const bookingsRepository = createRepositoryMock();
    const usersRepository = createRepositoryMock();
    const walletService = {
      recordTransaction: jest.fn().mockResolvedValue(undefined),
    };
    const configService = { get: jest.fn() };
    const service = new PaymentsService(
      configService as never,
      paymentsRepository as never,
      bookingsRepository as never,
      usersRepository as never,
      walletService as never,
    );

    const booking = Object.assign(new BookingEntity(), {
      id: 'booking-1',
      bookingRef: 'KZ-1',
      customerId: 'customer-1',
      providerId: 'provider-1',
      serviceCategoryId: 'cat-1',
      serviceId: 'svc-1',
      type: 'instant' as never,
      status: BookingStatus.IN_PROGRESS,
      paymentMethod: PaymentMethod.WALLET,
      paymentStatus: PaymentStatus.PENDING,
      quotedPriceCents: 10_000,
      finalPriceCents: 10_000,
      commissionCents: 1_500,
      providerEarningsCents: 8_500,
      discountCents: 0,
      promoCode: null,
      paymentGatewayRef: null,
      customerLat: null,
      customerLng: null,
      customerAddress: 'Sandton, Johannesburg',
      providerCurrentLat: null,
      providerCurrentLng: null,
      providerLocationUpdatedAt: null,
      scheduledAt: null,
      acceptedAt: null,
      enRouteAt: null,
      arrivedAt: null,
      startedAt: null,
      completedAt: null,
      cancelledAt: null,
      cancelReason: null,
      cancelledBy: null,
      customerNotes: null,
      providerNotes: null,
      isRated: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      customer: null,
      provider: null,
    });

    paymentsRepository.findOne.mockResolvedValue(null);
    paymentsRepository.save
      .mockImplementationOnce(async (value) => ({ id: 'payment-1', status: PaymentStatus.PENDING, ...value }))
      .mockImplementationOnce(async (value) => ({ id: 'payment-1', ...value }));
    bookingsRepository.save.mockImplementation(async (value) => value);

    const payment = await service.settleBookingCompletion(booking, {
      actorId: 'provider-1',
      actorRole: UserRole.PROVIDER,
      gatewayReference: 'manual-settlement-1',
      note: 'Provider completed booking',
    });

    expect(walletService.recordTransaction).toHaveBeenNthCalledWith(1, {
      userId: 'customer-1',
      direction: WalletTransactionDirection.DEBIT,
      amountCents: 10_000,
      referenceType: WalletReferenceType.BOOKING_PAYMENT,
      referenceId: 'booking-1',
      bookingId: 'booking-1',
      paymentTransactionId: 'payment-1',
      description: 'Wallet payment for booking KZ-1',
    });
    expect(walletService.recordTransaction).toHaveBeenNthCalledWith(2, {
      userId: 'provider-1',
      direction: WalletTransactionDirection.CREDIT,
      amountCents: 8_500,
      referenceType: WalletReferenceType.PROVIDER_EARNING,
      referenceId: 'booking-1',
      bookingId: 'booking-1',
      paymentTransactionId: 'payment-1',
      description: 'Provider earnings for booking KZ-1',
    });
    expect(bookingsRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ paymentStatus: PaymentStatus.PAID }),
    );
    expect(payment).toEqual(
      expect.objectContaining({
        bookingId: 'booking-1',
        status: PaymentStatus.PAID,
        gatewayReference: 'manual-settlement-1',
        providerId: 'provider-1',
      }),
    );
  });
});