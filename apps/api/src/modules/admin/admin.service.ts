import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BookingEntity, BookingStatus, PaymentStatus } from '../bookings/entities/booking.entity';
import { PaymentTransactionEntity } from '../payments/entities/payment-transaction.entity';
import {
  ProviderDocumentEntity,
  ProviderDocumentStatus,
} from '../providers/entities/provider-document.entity';
import {
  ProviderProfileEntity,
  ProviderVerificationStatus,
} from '../providers/entities/provider-profile.entity';
import { ReviewEntity } from '../reviews/entities/review.entity';
import { UserEntity, UserRole, UserStatus } from '../users/entities/user.entity';
import { ReviewProviderVerificationDto } from './dto/review-provider-verification.dto';
import { UpdatePlatformSettingsDto } from './dto/update-platform-settings.dto';
import { PlatformSettingsEntity } from './entities/platform-settings.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(PlatformSettingsEntity)
    private readonly settingsRepository: Repository<PlatformSettingsEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(ProviderProfileEntity)
    private readonly providerProfilesRepository: Repository<ProviderProfileEntity>,
    @InjectRepository(ProviderDocumentEntity)
    private readonly providerDocumentsRepository: Repository<ProviderDocumentEntity>,
    @InjectRepository(BookingEntity)
    private readonly bookingsRepository: Repository<BookingEntity>,
    @InjectRepository(PaymentTransactionEntity)
    private readonly paymentsRepository: Repository<PaymentTransactionEntity>,
    @InjectRepository(ReviewEntity)
    private readonly reviewsRepository: Repository<ReviewEntity>,
    private readonly configService: ConfigService,
  ) {}

  async getSettings() {
    return this.ensureSettings();
  }

  async getEffectiveCommissionRate() {
    const settings = await this.ensureSettings();
    return Number(settings.defaultCommissionRate);
  }

  async updateSettings(actor: { id: string; role: UserRole }, dto: UpdatePlatformSettingsDto) {
    this.assertAdmin(actor.role);
    const settings = await this.ensureSettings();
    Object.assign(settings, dto, { updatedByUserId: actor.id });
    return this.settingsRepository.save(settings);
  }

  async listPendingProviderVerifications(actorRole: UserRole) {
    this.assertAdmin(actorRole);

    const profiles = await this.providerProfilesRepository.find({
      where: { verificationStatus: ProviderVerificationStatus.PENDING },
      relations: ['user'],
      order: { updatedAt: 'ASC' },
    });

    const userIds = profiles.map((profile) => profile.userId);
    const documents = userIds.length > 0
      ? await this.providerDocumentsRepository.find({
        where: { userId: In(userIds) },
        order: { createdAt: 'DESC' },
      })
      : [];

    return profiles.map((profile) => ({
      ...profile,
      documents: documents.filter((document) => document.userId === profile.userId),
    }));
  }

  async reviewProviderVerification(
    actor: { id: string; role: UserRole },
    providerUserId: string,
    dto: ReviewProviderVerificationDto,
  ) {
    this.assertAdmin(actor.role);

    const user = await this.usersRepository.findOne({ where: { id: providerUserId } });
    if (!user) throw new NotFoundException('Provider user not found');

    const profile = await this.providerProfilesRepository.findOne({ where: { userId: providerUserId } });
    if (!profile) throw new NotFoundException('Provider profile not found');

    const targetDocuments = dto.documentIds?.length
      ? await this.providerDocumentsRepository.find({
        where: { id: In(dto.documentIds), userId: providerUserId },
      })
      : await this.providerDocumentsRepository.find({ where: { userId: providerUserId } });

    const documentStatus = dto.status === ProviderVerificationStatus.APPROVED
      ? ProviderDocumentStatus.APPROVED
      : ProviderDocumentStatus.REJECTED;

    for (const document of targetDocuments) {
      document.status = documentStatus;
      document.reviewNote = dto.note;
      document.reviewedAt = new Date();
      document.reviewedByUserId = actor.id;
    }

    if (targetDocuments.length > 0) {
      await this.providerDocumentsRepository.save(targetDocuments);
    }

    profile.verificationStatus = dto.status;
    profile.isAvailable = dto.status === ProviderVerificationStatus.APPROVED
      ? profile.isAvailable
      : false;
    await this.providerProfilesRepository.save(profile);

    user.status = dto.status === ProviderVerificationStatus.APPROVED
      ? UserStatus.ACTIVE
      : UserStatus.INACTIVE;
    await this.usersRepository.save(user);

    return {
      user,
      profile,
      documents: await this.providerDocumentsRepository.find({ where: { userId: providerUserId } }),
    };
  }

  async getDashboardMetrics(actorRole: UserRole) {
    this.assertAdmin(actorRole);

    const [
      customerCount,
      providerCount,
      pendingVerifications,
      activeBookings,
      scheduledBookings,
      completedBookings,
      paidTransactions,
      grossMerchandiseValue,
      providerPayouts,
      averageRating,
    ] = await Promise.all([
      this.usersRepository.count({ where: { role: UserRole.CUSTOMER } }),
      this.usersRepository.count({ where: { role: UserRole.PROVIDER } }),
      this.providerProfilesRepository.count({ where: { verificationStatus: ProviderVerificationStatus.PENDING } }),
      this.bookingsRepository.count({ where: { status: In([BookingStatus.PENDING, BookingStatus.ACCEPTED, BookingStatus.EN_ROUTE, BookingStatus.ARRIVED, BookingStatus.IN_PROGRESS]) } }),
      this.bookingsRepository.count({ where: { status: BookingStatus.PENDING, type: 'scheduled' as never } }),
      this.bookingsRepository.count({ where: { status: BookingStatus.COMPLETED } }),
      this.paymentsRepository.count({ where: { status: PaymentStatus.PAID } }),
      this.paymentsRepository.createQueryBuilder('payment').select('COALESCE(SUM(payment.amountCents), 0)', 'sum').getRawOne<{ sum: string }>(),
      this.paymentsRepository.createQueryBuilder('payment').select('COALESCE(SUM(payment.providerEarningsCents), 0)', 'sum').where('payment.status = :status', { status: PaymentStatus.PAID }).getRawOne<{ sum: string }>(),
      this.reviewsRepository.createQueryBuilder('review').select('COALESCE(AVG(review.rating), 0)', 'avg').getRawOne<{ avg: string }>(),
    ]);

    return {
      customerCount,
      providerCount,
      pendingVerifications,
      activeBookings,
      scheduledBookings,
      completedBookings,
      paidTransactions,
      grossMerchandiseValueCents: Number(grossMerchandiseValue?.sum || 0),
      providerPayoutsCents: Number(providerPayouts?.sum || 0),
      averageRating: Number(Number(averageRating?.avg || 0).toFixed(2)),
    };
  }

  async listRecentPayments(actorRole: UserRole) {
    this.assertAdmin(actorRole);

    const payments = await this.paymentsRepository.find({
      order: { updatedAt: 'DESC' },
      take: 10,
    });

    const bookings = payments.length === 0
      ? []
      : await this.bookingsRepository.find({ where: { id: In(payments.map((payment) => payment.bookingId)) } });
    const bookingsById = new Map(bookings.map((booking) => [booking.id, booking]));

    return payments.map((payment) => ({
      ...payment,
      bookingRef: bookingsById.get(payment.bookingId)?.bookingRef,
    }));
  }

  private assertAdmin(role: UserRole) {
    if (role !== UserRole.ADMIN) {
      throw new ForbiddenException('Admin access is required for this action');
    }
  }

  private async ensureSettings() {
    const existing = await this.settingsRepository.find({
      order: { createdAt: 'ASC' },
      take: 1,
    });
    if (existing.length > 0) return existing[0];

    const defaultCommissionRate = this.configService.get<number>('app.defaultCommissionRate') ?? 0.15;
    const created = this.settingsRepository.create({ defaultCommissionRate });
    return this.settingsRepository.save(created);
  }
}