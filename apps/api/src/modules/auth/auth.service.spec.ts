import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserRole } from '../users/entities/user.entity';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

function build() {
  const otpRepository = {
    findOne: jest.fn(),
    update: jest.fn(),
    increment: jest.fn(),
  };
  const coachProfilesRepository = {
    findOne: jest.fn(),
  };
  const vendorProfilesRepository = {
    findOne: jest.fn(),
  };
  const usersService = {
    findByPhone: jest.fn(),
    createFromPhone: jest.fn(),
  };
  const jwtService = {
    signAsync: jest.fn().mockResolvedValue('signed-token'),
  };
  const configService = {
    get: jest.fn(),
  };

  const service = new AuthService(
    otpRepository as never,
    coachProfilesRepository as never,
    vendorProfilesRepository as never,
    usersService as never,
    jwtService as never,
    configService as never,
  );

  return { service, otpRepository, coachProfilesRepository, vendorProfilesRepository, usersService };
}

describe('AuthService coach approval gate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  it('rejects a coach login when no CoachProfileEntity exists for that phone', async () => {
    const { service, otpRepository, usersService, coachProfilesRepository } = build();
    otpRepository.findOne.mockResolvedValue({ id: 'otp-1', hashedCode: 'x', expiresAt: new Date(Date.now() + 60000), attempts: 0 });
    usersService.findByPhone.mockResolvedValue({ id: 'user-1', role: UserRole.COACH, phone: '+27821234567' });
    coachProfilesRepository.findOne.mockResolvedValue(null);

    await expect(service.verifyOtp('0821234567', '123456', UserRole.COACH)).rejects.toThrow(UnauthorizedException);
    expect(usersService.createFromPhone).not.toHaveBeenCalled();
  });

  it('rejects a coach login for a phone number with no account at all', async () => {
    const { service, otpRepository, usersService } = build();
    otpRepository.findOne.mockResolvedValue({ id: 'otp-1', hashedCode: 'x', expiresAt: new Date(Date.now() + 60000), attempts: 0 });
    usersService.findByPhone.mockResolvedValue(null);

    await expect(service.verifyOtp('0821234567', '123456', UserRole.COACH)).rejects.toThrow(UnauthorizedException);
  });

  it('allows a coach login once an admin-created CoachProfileEntity exists', async () => {
    const { service, otpRepository, usersService, coachProfilesRepository } = build();
    otpRepository.findOne.mockResolvedValue({ id: 'otp-1', hashedCode: 'x', expiresAt: new Date(Date.now() + 60000), attempts: 0 });
    usersService.findByPhone.mockResolvedValue({ id: 'user-1', role: UserRole.COACH, phone: '+27821234567' });
    coachProfilesRepository.findOne.mockResolvedValue({ id: 'profile-1', userId: 'user-1' });

    const result = await service.verifyOtp('0821234567', '123456', UserRole.COACH);

    expect(result.accessToken).toBe('signed-token');
    expect(usersService.createFromPhone).not.toHaveBeenCalled();
  });

  it('still auto-creates a new customer account for a plain client login', async () => {
    const { service, otpRepository, usersService } = build();
    otpRepository.findOne.mockResolvedValue({ id: 'otp-1', hashedCode: 'x', expiresAt: new Date(Date.now() + 60000), attempts: 0 });
    usersService.findByPhone.mockResolvedValue(null);
    usersService.createFromPhone.mockResolvedValue({ id: 'user-2', role: UserRole.CUSTOMER, phone: '+27821234567' });

    const result = await service.verifyOtp('0821234567', '123456');

    expect(usersService.createFromPhone).toHaveBeenCalledWith('+27821234567', UserRole.CUSTOMER);
    expect(result.isNewUser).toBe(true);
  });
});

describe('AuthService vendor approval gate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  it('rejects a vendor login when no WeddingVendorProfileEntity exists for that phone', async () => {
    const { service, otpRepository, usersService, vendorProfilesRepository } = build();
    otpRepository.findOne.mockResolvedValue({ id: 'otp-1', hashedCode: 'x', expiresAt: new Date(Date.now() + 60000), attempts: 0 });
    usersService.findByPhone.mockResolvedValue({ id: 'user-1', role: UserRole.VENDOR, phone: '+27821234567' });
    vendorProfilesRepository.findOne.mockResolvedValue(null);

    await expect(service.verifyOtp('0821234567', '123456', UserRole.VENDOR)).rejects.toThrow(UnauthorizedException);
    expect(usersService.createFromPhone).not.toHaveBeenCalled();
  });

  it('allows a vendor login once an admin-created WeddingVendorProfileEntity exists', async () => {
    const { service, otpRepository, usersService, vendorProfilesRepository } = build();
    otpRepository.findOne.mockResolvedValue({ id: 'otp-1', hashedCode: 'x', expiresAt: new Date(Date.now() + 60000), attempts: 0 });
    usersService.findByPhone.mockResolvedValue({ id: 'user-1', role: UserRole.VENDOR, phone: '+27821234567' });
    vendorProfilesRepository.findOne.mockResolvedValue({ id: 'profile-1', userId: 'user-1', vendorId: 'vendor-1' });

    const result = await service.verifyOtp('0821234567', '123456', UserRole.VENDOR);

    expect(result.accessToken).toBe('signed-token');
    expect(usersService.createFromPhone).not.toHaveBeenCalled();
  });
});

describe('AuthService blocks self-registration for provider and admin roles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  it('rejects a provider OTP login attempt, even for a brand-new phone number', async () => {
    const { service, otpRepository, usersService } = build();
    otpRepository.findOne.mockResolvedValue({ id: 'otp-1', hashedCode: 'x', expiresAt: new Date(Date.now() + 60000), attempts: 0 });
    usersService.findByPhone.mockResolvedValue(null);

    await expect(service.verifyOtp('0821234567', '123456', UserRole.PROVIDER)).rejects.toThrow(UnauthorizedException);
    expect(usersService.createFromPhone).not.toHaveBeenCalled();
  });

  it('rejects an admin OTP login attempt, even for a brand-new phone number', async () => {
    const { service, otpRepository, usersService } = build();
    otpRepository.findOne.mockResolvedValue({ id: 'otp-1', hashedCode: 'x', expiresAt: new Date(Date.now() + 60000), attempts: 0 });
    usersService.findByPhone.mockResolvedValue(null);

    await expect(service.verifyOtp('0821234567', '123456', UserRole.ADMIN)).rejects.toThrow(UnauthorizedException);
    expect(usersService.createFromPhone).not.toHaveBeenCalled();
  });
});
