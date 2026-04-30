import { UserRole } from '../users/entities/user.entity';
import { BookingStatus, PaymentStatus } from '../bookings/entities/booking.entity';
import { ProviderVerificationStatus } from '../providers/entities/provider-profile.entity';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  function createRepositoryMock() {
    return {
      count: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn((value) => value),
      createQueryBuilder: jest.fn(),
    };
  }

  it('returns aggregate dashboard metrics for admins', async () => {
    const settingsRepository = createRepositoryMock();
    const usersRepository = createRepositoryMock();
    const providerProfilesRepository = createRepositoryMock();
    const providerDocumentsRepository = createRepositoryMock();
    const bookingsRepository = createRepositoryMock();
    const paymentsRepository = createRepositoryMock();
    const reviewsRepository = createRepositoryMock();
    const configService = { get: jest.fn() };

    usersRepository.count
      .mockResolvedValueOnce(14)
      .mockResolvedValueOnce(9);
    providerProfilesRepository.count.mockResolvedValue(3);
    bookingsRepository.count
      .mockResolvedValueOnce(6)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(18);
    paymentsRepository.count.mockResolvedValue(12);
    paymentsRepository.createQueryBuilder
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ sum: '185000' }),
      })
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ sum: '142500' }),
      });
    reviewsRepository.createQueryBuilder.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ avg: '4.25' }),
    });

    const service = new AdminService(
      settingsRepository as never,
      usersRepository as never,
      providerProfilesRepository as never,
      providerDocumentsRepository as never,
      bookingsRepository as never,
      paymentsRepository as never,
      reviewsRepository as never,
      configService as never,
    );

    const metrics = await service.getDashboardMetrics(UserRole.ADMIN);

    expect(usersRepository.count).toHaveBeenNthCalledWith(1, { where: { role: UserRole.CUSTOMER } });
    expect(usersRepository.count).toHaveBeenNthCalledWith(2, { where: { role: UserRole.PROVIDER } });
    expect(providerProfilesRepository.count).toHaveBeenCalledWith({ where: { verificationStatus: ProviderVerificationStatus.PENDING } });
    expect(bookingsRepository.count).toHaveBeenNthCalledWith(1, {
      where: { status: expect.anything() },
    });
    expect(bookingsRepository.count).toHaveBeenNthCalledWith(2, {
      where: { status: BookingStatus.PENDING, type: 'scheduled' },
    });
    expect(paymentsRepository.count).toHaveBeenCalledWith({ where: { status: PaymentStatus.PAID } });
    expect(metrics).toEqual({
      customerCount: 14,
      providerCount: 9,
      pendingVerifications: 3,
      activeBookings: 6,
      scheduledBookings: 4,
      completedBookings: 18,
      paidTransactions: 12,
      grossMerchandiseValueCents: 185000,
      providerPayoutsCents: 142500,
      averageRating: 4.25,
    });
  });
});