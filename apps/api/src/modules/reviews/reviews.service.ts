import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookingEntity, BookingStatus } from '../bookings/entities/booking.entity';
import { ProviderProfileEntity } from '../providers/entities/provider-profile.entity';
import { UserRole } from '../users/entities/user.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewEntity } from './entities/review.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(ReviewEntity)
    private readonly reviewsRepository: Repository<ReviewEntity>,
    @InjectRepository(BookingEntity)
    private readonly bookingsRepository: Repository<BookingEntity>,
    @InjectRepository(ProviderProfileEntity)
    private readonly providerProfilesRepository: Repository<ProviderProfileEntity>,
  ) {}

  async createReview(userId: string, role: UserRole, dto: CreateReviewDto) {
    const booking = await this.bookingsRepository.findOne({ where: { id: dto.bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException('Only completed bookings can be reviewed');
    }

    const isCustomerReviewer = booking.customerId === userId && role === UserRole.CUSTOMER;
    const isProviderReviewer = booking.providerId === userId && role === UserRole.PROVIDER;

    if (!isCustomerReviewer && !isProviderReviewer) {
      throw new ForbiddenException('You can only review bookings that you completed yourself');
    }

    if (!booking.providerId) {
      throw new BadRequestException('This booking has no assigned provider to review');
    }

    if (isCustomerReviewer && booking.customerHasRated) {
      throw new BadRequestException('You have already reviewed this provider for this booking');
    }

    if (isProviderReviewer && booking.providerHasRated) {
      throw new BadRequestException('You have already reviewed this customer for this booking');
    }

    const revieweeUserId = isCustomerReviewer ? booking.providerId : booking.customerId;
    const revieweeRole = isCustomerReviewer ? UserRole.PROVIDER : UserRole.CUSTOMER;

    const review = this.reviewsRepository.create({
      bookingId: booking.id,
      customerId: booking.customerId,
      providerUserId: booking.providerId,
      reviewerUserId: userId,
      reviewerRole: role,
      revieweeUserId,
      revieweeRole,
      rating: dto.rating,
      comment: dto.comment?.trim() || null,
    });
    const savedReview = await this.reviewsRepository.save(review);

    if (isCustomerReviewer) {
      booking.customerHasRated = true;
      booking.isRated = true;
    }

    if (isProviderReviewer) {
      booking.providerHasRated = true;
    }

    await this.bookingsRepository.save(booking);

    if (revieweeRole === UserRole.PROVIDER) {
      await this.refreshProviderReviewStats(booking.providerId);
    }

    return savedReview;
  }

  async listMyReviews(userId: string, role: UserRole) {
    return this.reviewsRepository.find({
      where: { revieweeUserId: userId, revieweeRole: role },
      order: { createdAt: 'DESC' },
    });
  }

  async listProviderReviews(providerUserId: string) {
    return this.reviewsRepository.find({
      where: { revieweeUserId: providerUserId, revieweeRole: UserRole.PROVIDER },
      order: { createdAt: 'DESC' },
    });
  }

  private async refreshProviderReviewStats(providerUserId: string) {
    const profile = await this.providerProfilesRepository.findOne({ where: { userId: providerUserId } });
    if (!profile) return;

    const reviews = await this.reviewsRepository.find({
      where: { revieweeUserId: providerUserId, revieweeRole: UserRole.PROVIDER },
    });
    const completedBookings = await this.bookingsRepository.count({
      where: { providerId: providerUserId, status: BookingStatus.COMPLETED },
    });

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    profile.averageRating = reviews.length == 0 ? 0 : Number((totalRating / reviews.length).toFixed(2));
    profile.totalJobsCompleted = completedBookings;
    await this.providerProfilesRepository.save(profile);
  }
}