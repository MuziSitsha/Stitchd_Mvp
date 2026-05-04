import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity, UserRole, UserStatus } from './entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
  ) {}

  async findById(id: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByPhone(phone: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({ where: { phone } });
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async upsertAdminAccount(params: {
    email: string;
    phone: string;
    passwordHash: string;
    firstName?: string;
    lastName?: string;
  }): Promise<UserEntity> {
    const existing = await this.usersRepository.findOne({
      where: [{ email: params.email }, { phone: params.phone }],
    });

    const user = existing ?? this.usersRepository.create();
    user.email = params.email;
    user.phone = params.phone;
    user.passwordHash = params.passwordHash;
    user.role = UserRole.ADMIN;
    user.status = UserStatus.ACTIVE;
    user.isActive = true;
    user.isPhoneVerified = true;
    user.isEmailVerified = true;
    user.firstName = params.firstName ?? user.firstName ?? 'KAZI';
    user.lastName = params.lastName ?? user.lastName ?? 'Admin';
    user.preferredLanguage = user.preferredLanguage || 'en';
    user.referralCode = user.referralCode || this.generateReferralCode();

    return this.usersRepository.save(user);
  }

  async createFromPhone(phone: string, role: UserRole = UserRole.CUSTOMER): Promise<UserEntity> {
    const referralCode = this.generateReferralCode();
    const user = this.usersRepository.create({
      phone,
      role,
      referralCode,
      isPhoneVerified: true,
    });
    return this.usersRepository.save(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserEntity> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    Object.assign(user, dto);
    return this.usersRepository.save(user);
  }

  async updateFcmToken(userId: string, fcmToken: string): Promise<void> {
    await this.usersRepository.update({ id: userId }, { fcmToken });
  }

  async updateLastActive(userId: string): Promise<void> {
    await this.usersRepository.update({ id: userId }, { lastActiveAt: new Date() });
  }

  async findByReferralCode(code: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({ where: { referralCode: code } });
  }

  async addWalletBalance(userId: string, amountCents: number): Promise<void> {
    await this.usersRepository.increment({ id: userId }, 'walletBalanceCents', amountCents);
  }

  async deductWalletBalance(userId: string, amountCents: number): Promise<boolean> {
    const user = await this.findById(userId);
    if (!user || user.walletBalanceCents < amountCents) return false;
    await this.usersRepository.decrement({ id: userId }, 'walletBalanceCents', amountCents);
    return true;
  }

  private generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const prefix = 'KAZI';
    let code = prefix;
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}
