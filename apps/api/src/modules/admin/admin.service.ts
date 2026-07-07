import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CoachProfileEntity } from '../planner/entities/coach-profile.entity';
import { WeddingEventEntity } from '../planner/entities/wedding-event.entity';
import { WeddingVendorEntity } from '../planner/entities/wedding-vendor.entity';
import { WeddingVendorPaymentEntity } from '../planner/entities/wedding-vendor-payment.entity';
import { WeddingVendorProfileEntity } from '../planner/entities/wedding-vendor-profile.entity';
import { WeddingVendorSelectionEntity } from '../planner/entities/wedding-vendor-selection.entity';
import { UserEntity, UserRole } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { normalizeSaPhone } from '../../common/phone.util';
import { AssignCoachDto } from './dto/assign-coach.dto';
import { CreateCoachProfileDto } from './dto/create-coach-profile.dto';
import { CreateVendorProfileDto } from './dto/create-vendor-profile.dto';
import { CreateWeddingVendorDto } from './dto/create-wedding-vendor.dto';
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
    @InjectRepository(WeddingEventEntity)
    private readonly weddingEventsRepository: Repository<WeddingEventEntity>,
    @InjectRepository(WeddingVendorSelectionEntity)
    private readonly vendorSelectionsRepository: Repository<WeddingVendorSelectionEntity>,
    @InjectRepository(CoachProfileEntity)
    private readonly coachProfilesRepository: Repository<CoachProfileEntity>,
    @InjectRepository(WeddingVendorEntity)
    private readonly weddingVendorsRepository: Repository<WeddingVendorEntity>,
    @InjectRepository(WeddingVendorPaymentEntity)
    private readonly vendorPaymentsRepository: Repository<WeddingVendorPaymentEntity>,
    @InjectRepository(WeddingVendorProfileEntity)
    private readonly vendorProfilesRepository: Repository<WeddingVendorProfileEntity>,
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

  async getDashboardMetrics(actorRole: UserRole) {
    this.assertAdmin(actorRole);

    const [
      customerCount,
      coachCount,
      totalSignups,
      activeWeddingEvents,
      totalPaid,
      vendorListingCount,
    ] = await Promise.all([
      this.usersRepository.count({ where: { role: UserRole.CUSTOMER } }),
      this.usersRepository.count({ where: { role: UserRole.COACH } }),
      this.usersRepository.count(),
      this.weddingEventsRepository.count(),
      this.vendorSelectionsRepository.createQueryBuilder('selection').select('COALESCE(SUM(selection.amountPaidCents), 0)', 'sum').getRawOne<{ sum: string }>(),
      this.weddingVendorsRepository.count(),
    ]);

    return {
      customerCount,
      coachCount,
      totalSignups,
      activeWeddingEvents,
      totalPaidCents: Number(totalPaid?.sum || 0),
      vendorListingCount,
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

  async listRecentVendorPayments(actorRole: UserRole) {
    this.assertAdmin(actorRole);

    const payments = await this.vendorPaymentsRepository.find({
      order: { updatedAt: 'DESC' },
      take: 10,
    });

    const selections = payments.length === 0
      ? []
      : await this.vendorSelectionsRepository.find({ where: { id: In(payments.map((payment) => payment.vendorSelectionId)) } });
    const selectionsById = new Map(selections.map((selection) => [selection.id, selection]));

    return payments.map((payment) => ({
      ...payment,
      vendorName: selectionsById.get(payment.vendorSelectionId)?.vendorName,
      slot: selectionsById.get(payment.vendorSelectionId)?.slot,
    }));
  }

  async listVendorProfiles(actorRole: UserRole) {
    this.assertAdmin(actorRole);

    const profiles = await this.vendorProfilesRepository.find({
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });

    const vendorIds = profiles.map((profile) => profile.vendorId);
    const listings = vendorIds.length === 0
      ? []
      : await this.weddingVendorsRepository.find({ where: { id: In(vendorIds) } });
    const listingsById = new Map(listings.map((listing) => [listing.id, listing]));

    return profiles.map((profile) => ({
      ...profile,
      vendorName: listingsById.get(profile.vendorId)?.name,
      slot: listingsById.get(profile.vendorId)?.slot,
    }));
  }

  async createVendorProfile(actorRole: UserRole, dto: CreateVendorProfileDto) {
    this.assertAdmin(actorRole);

    const vendor = await this.weddingVendorsRepository.findOne({ where: { id: dto.vendorId } });
    if (!vendor) throw new NotFoundException('Wedding vendor catalog listing not found');

    const normalizedPhone = normalizeSaPhone(dto.phone);
    let user = await this.usersRepository.findOne({ where: { phone: normalizedPhone } });

    if (!user) {
      user = await this.usersService.createFromPhone(normalizedPhone, UserRole.VENDOR);
    } else if (user.role !== UserRole.VENDOR) {
      throw new ForbiddenException('This phone number already belongs to a non-vendor account');
    }

    if (dto.firstName || dto.lastName) {
      user.firstName = dto.firstName ?? user.firstName;
      user.lastName = dto.lastName ?? user.lastName;
      await this.usersRepository.save(user);
    }

    const existing = await this.vendorProfilesRepository.findOne({ where: { userId: user.id } });
    if (existing) {
      existing.vendorId = dto.vendorId;
      return this.vendorProfilesRepository.save(existing);
    }

    const created = this.vendorProfilesRepository.create({
      userId: user.id,
      vendorId: dto.vendorId,
    });
    return this.vendorProfilesRepository.save(created);
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
