import { UserRole } from '../users/entities/user.entity';
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
    const weddingEventsRepository = createRepositoryMock();
    const vendorSelectionsRepository = createRepositoryMock();
    const coachProfilesRepository = createRepositoryMock();
    const weddingVendorsRepository = createRepositoryMock();
    const vendorPaymentsRepository = createRepositoryMock();
    const vendorProfilesRepository = createRepositoryMock();
    const configService = { get: jest.fn() };

    usersRepository.count
      .mockResolvedValueOnce(14)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(25);
    weddingEventsRepository.count.mockResolvedValue(5);
    vendorSelectionsRepository.createQueryBuilder.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ sum: '50000' }),
    });
    weddingVendorsRepository.count.mockResolvedValue(17);

    const service = new AdminService(
      settingsRepository as never,
      usersRepository as never,
      weddingEventsRepository as never,
      vendorSelectionsRepository as never,
      coachProfilesRepository as never,
      weddingVendorsRepository as never,
      vendorPaymentsRepository as never,
      vendorProfilesRepository as never,
      { createFromPhone: jest.fn() } as never,
      configService as never,
    );

    const metrics = await service.getDashboardMetrics(UserRole.ADMIN);

    expect(usersRepository.count).toHaveBeenNthCalledWith(1, { where: { role: UserRole.CUSTOMER } });
    expect(usersRepository.count).toHaveBeenNthCalledWith(2, { where: { role: UserRole.COACH } });
    expect(metrics).toEqual({
      customerCount: 14,
      coachCount: 3,
      totalSignups: 25,
      activeWeddingEvents: 5,
      totalPaidCents: 50000,
      vendorListingCount: 17,
    });
  });
});
