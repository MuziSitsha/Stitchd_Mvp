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
import { CoachProfileEntity } from '../planner/entities/coach-profile.entity';
import { WeddingEventEntity } from '../planner/entities/wedding-event.entity';
import { WeddingVendorEntity } from '../planner/entities/wedding-vendor.entity';
import { WeddingVendorSelectionEntity } from '../planner/entities/wedding-vendor-selection.entity';
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
import { UsersService } from '../users/users.service';
import { normalizeSaPhone } from '../../common/phone.util';
import { AssignCoachDto } from './dto/assign-coach.dto';
import { CreateCoachProfileDto } from './dto/create-coach-profile.dto';
import { CreateWeddingVendorDto } from './dto/create-wedding-vendor.dto';
import { ReviewProviderVerificationDto } from './dto/review-provider-verification.dto';
import { UpdatePlatformSettingsDto } from './dto/update-platform-settings.dto';
import { UpdateWeddingVendorDto } from './dto/update-wedding-vendor.dto';
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
    @InjectRepository(WeddingEventEntity)
    private readonly weddingEventsRepository: Repository<WeddingEventEntity>,
    @InjectRepository(WeddingVendorSelectionEntity)
    private readonly vendorSelectionsRepository: Repository<WeddingVendorSelectionEntity>,
    @InjectRepository(CoachProfileEntity)
    private readonly coachProfilesRepository: Repository<CoachProfileEntity>,
    @InjectRepository(WeddingVendorEntity)
    private readonly weddingVendorsRepository: Repository<WeddingVendorEntity>,
    private readonly usersService: UsersService,
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
      totalSignups,
      activeWeddingEvents,
      totalPaid,
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
      this.usersRepository.count(),
      this.weddingEventsRepository.count(),
      this.vendorSelectionsRepository.createQueryBuilder('selection').select('COALESCE(SUM(selection.amountPaidCents), 0)', 'sum').getRawOne<{ sum: string }>(),
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
      totalSignups,
      activeWeddingEvents,
      totalPaidCents: Number(totalPaid?.sum || 0),
    };
  }

  async listWeddingEvents(actorRole: UserRole) {
    this.assertAdmin(actorRole);

    const events = await this.weddingEventsRepository.find({
      relations: ['owner', 'coach'],
      order: { createdAt: 'DESC' },
    });

    const eventIds = events.map((event) => event.id);
    const selectionCounts = eventIds.length === 0
      ? []
      : await this.vendorSelectionsRepository
        .createQueryBuilder('selection')
        .select('selection.weddingEventId', 'weddingEventId')
        .addSelect('COUNT(*)', 'count')
        .where('selection.weddingEventId IN (:...eventIds)', { eventIds })
        .groupBy('selection.weddingEventId')
        .getRawMany<{ weddingEventId: string; count: string }>();

    const countsByEventId = new Map(selectionCounts.map((row) => [row.weddingEventId, Number(row.count)]));

    return events.map((event) => ({
      ...event,
      packagesChosenCount: countsByEventId.get(event.id) || 0,
    }));
  }

  async getWeddingEventDetail(actorRole: UserRole, eventId: string) {
    this.assertAdmin(actorRole);

    const event = await this.weddingEventsRepository.findOne({
      where: { id: eventId },
      relations: ['owner', 'coach'],
    });
    if (!event) throw new NotFoundException('Wedding event not found');

    const selections = await this.vendorSelectionsRepository.find({
      where: { weddingEventId: eventId },
      order: { createdAt: 'ASC' },
    });

    return { event, selections };
  }

  async listCoaches(actorRole: UserRole) {
    this.assertAdmin(actorRole);

    const coaches = await this.coachProfilesRepository.find({
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });

    const caseloadCounts = await this.weddingEventsRepository
      .createQueryBuilder('event')
      .select('event.coachUserId', 'coachUserId')
      .addSelect('COUNT(*)', 'count')
      .where('event.coachUserId IS NOT NULL')
      .groupBy('event.coachUserId')
      .getRawMany<{ coachUserId: string; count: string }>();

    const caseloadByUserId = new Map(caseloadCounts.map((row) => [row.coachUserId, Number(row.count)]));

    return coaches.map((coach) => ({
      ...coach,
      assignedEventsCount: caseloadByUserId.get(coach.userId) || 0,
    }));
  }

  async createCoachProfile(actorRole: UserRole, dto: CreateCoachProfileDto) {
    this.assertAdmin(actorRole);

    const normalizedPhone = normalizeSaPhone(dto.phone);
    let user = await this.usersRepository.findOne({ where: { phone: normalizedPhone } });

    if (!user) {
      user = await this.usersService.createFromPhone(normalizedPhone, UserRole.COACH);
    } else if (user.role !== UserRole.COACH) {
      throw new ForbiddenException('This phone number already belongs to a non-coach account');
    }

    if (dto.firstName || dto.lastName) {
      user.firstName = dto.firstName ?? user.firstName;
      user.lastName = dto.lastName ?? user.lastName;
      await this.usersRepository.save(user);
    }

    const existing = await this.coachProfilesRepository.findOne({ where: { userId: user.id } });
    if (existing) {
      Object.assign(existing, { bio: dto.bio, specialties: dto.specialties });
      return this.coachProfilesRepository.save(existing);
    }

    const created = this.coachProfilesRepository.create({
      userId: user.id,
      bio: dto.bio,
      specialties: dto.specialties,
    });
    return this.coachProfilesRepository.save(created);
  }

  async assignCoach(actorRole: UserRole, eventId: string, dto: AssignCoachDto) {
    this.assertAdmin(actorRole);

    const event = await this.weddingEventsRepository.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Wedding event not found');

    const coach = await this.usersRepository.findOne({ where: { id: dto.coachUserId } });
    if (!coach || coach.role !== UserRole.COACH) {
      throw new NotFoundException('Coach not found');
    }

    event.coachUserId = dto.coachUserId;
    return this.weddingEventsRepository.save(event);
  }

  async getCategoryBreakdown(actorRole: UserRole) {
    this.assertAdmin(actorRole);

    const rows = await this.vendorSelectionsRepository
      .createQueryBuilder('selection')
      .select('selection.slot', 'slot')
      .addSelect('COUNT(*)', 'selectionCount')
      .addSelect('COALESCE(SUM(selection.priceCents), 0)', 'totalCommittedCents')
      .addSelect('COALESCE(SUM(selection.amountPaidCents), 0)', 'totalPaidCents')
      .groupBy('selection.slot')
      .orderBy('COUNT(*)', 'DESC')
      .getRawMany<{ slot: string; selectionCount: string; totalCommittedCents: string; totalPaidCents: string }>();

    return rows.map((row) => ({
      slot: row.slot,
      selectionCount: Number(row.selectionCount),
      totalCommittedCents: Number(row.totalCommittedCents),
      totalPaidCents: Number(row.totalPaidCents),
    }));
  }

  async getCoachBreakdown(actorRole: UserRole) {
    this.assertAdmin(actorRole);

    const coaches = await this.coachProfilesRepository.find({ relations: ['user'] });

    const rows = await this.weddingEventsRepository
      .createQueryBuilder('event')
      .leftJoin(WeddingVendorSelectionEntity, 'selection', 'selection.weddingEventId = event.id')
      .select('event.coachUserId', 'coachUserId')
      .addSelect('COUNT(DISTINCT event.id)', 'assignedEventsCount')
      .addSelect('COALESCE(SUM(selection.amountPaidCents), 0)', 'totalPaidCents')
      .where('event.coachUserId IS NOT NULL')
      .groupBy('event.coachUserId')
      .getRawMany<{ coachUserId: string; assignedEventsCount: string; totalPaidCents: string }>();

    const rowsByCoachUserId = new Map(rows.map((row) => [row.coachUserId, row]));

    return coaches.map((coach) => {
      const row = rowsByCoachUserId.get(coach.userId);
      return {
        coachUserId: coach.userId,
        coachName: coach.user ? `${coach.user.firstName || ''} ${coach.user.lastName || ''}`.trim() : 'Unknown',
        assignedEventsCount: Number(row?.assignedEventsCount || 0),
        totalPaidCents: Number(row?.totalPaidCents || 0),
      };
    });
  }

  async listWeddingVendors(actorRole: UserRole) {
    this.assertAdmin(actorRole);
    return this.weddingVendorsRepository.find({ order: { slot: 'ASC', rating: 'DESC' } });
  }

  async createWeddingVendor(actorRole: UserRole, dto: CreateWeddingVendorDto) {
    this.assertAdmin(actorRole);
    const created = this.weddingVendorsRepository.create(dto);
    return this.weddingVendorsRepository.save(created);
  }

  async updateWeddingVendor(actorRole: UserRole, vendorId: string, dto: UpdateWeddingVendorDto) {
    this.assertAdmin(actorRole);
    const vendor = await this.weddingVendorsRepository.findOne({ where: { id: vendorId } });
    if (!vendor) throw new NotFoundException('Wedding vendor not found');
    Object.assign(vendor, dto);
    return this.weddingVendorsRepository.save(vendor);
  }

  async deleteWeddingVendor(actorRole: UserRole, vendorId: string) {
    this.assertAdmin(actorRole);
    const vendor = await this.weddingVendorsRepository.findOne({ where: { id: vendorId } });
    if (!vendor) throw new NotFoundException('Wedding vendor not found');
    await this.weddingVendorsRepository.remove(vendor);
    return { deleted: true };
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