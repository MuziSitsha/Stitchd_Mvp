import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity, UserRole, UserStatus } from '../users/entities/user.entity';
import {
  ProviderProfileEntity,
  ProviderVerificationStatus,
} from './entities/provider-profile.entity';
import { UpsertProviderProfileDto } from './dto/upsert-provider-profile.dto';

@Injectable()
export class ProvidersService {
  constructor(
    @InjectRepository(ProviderProfileEntity)
    private readonly providerProfilesRepository: Repository<ProviderProfileEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async onboard(userId: string, dto: UpsertProviderProfileDto) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    user.role = UserRole.PROVIDER;
    user.status = UserStatus.PENDING_VERIFICATION;
    await this.usersRepository.save(user);

    const existingProfile = await this.providerProfilesRepository.findOne({
      where: { userId },
    });

    const profile = existingProfile || this.providerProfilesRepository.create({ userId });
    Object.assign(profile, dto);
    profile.verificationStatus = ProviderVerificationStatus.PENDING;

    return this.providerProfilesRepository.save(profile);
  }

  async getMyProfile(userId: string) {
    const profile = await this.providerProfilesRepository.findOne({
      where: { userId },
      relations: ['user'],
    });
    if (!profile) throw new NotFoundException('Provider profile not found');
    return profile;
  }

  async updateProfile(userId: string, dto: UpsertProviderProfileDto) {
    const profile = await this.providerProfilesRepository.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('Provider profile not found');
    Object.assign(profile, dto);
    return this.providerProfilesRepository.save(profile);
  }

  async updateAvailability(userId: string, isAvailable: boolean) {
    const profile = await this.providerProfilesRepository.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('Provider profile not found');
    if (profile.verificationStatus !== ProviderVerificationStatus.APPROVED) {
      throw new ForbiddenException('Only approved providers can go online');
    }
    profile.isAvailable = isAvailable;
    return this.providerProfilesRepository.save(profile);
  }

  async listProviders(serviceCategoryId?: string) {
    const profiles = await this.providerProfilesRepository.find({
      where: { verificationStatus: ProviderVerificationStatus.APPROVED },
      relations: ['user'],
      order: { updatedAt: 'DESC' },
    });

    if (!serviceCategoryId) return profiles;

    return profiles.filter((profile) =>
      (profile.serviceCategoryIds || []).includes(serviceCategoryId),
    );
  }
}