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

  async createReview(customerId: string, dto: CreateReviewDto) {
    const booking = await this.bookingsRepository.findOne({ where: { id: dto.bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.customerId != customerId) {
      throw new ForbiddenException('You can only review your own completed bookings');
    }
    if (!booking.providerId) {
      throw new BadRequestException('This booking has no assigned provider to review');
    }
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException('Only completed bookings can be reviewed');
    }
    if (booking.isRated) {
      throw new BadRequestException('This booking has already been reviewed');
    }

    const review = this.reviewsRepository.create({
      bookingId: booking.id,
      customerId,
      providerUserId: booking.providerId,
      rating: dto.rating,
      comment: dto.comment?.trim() || null,
    });
    const savedReview = await this.reviewsRepository.save(review);

    booking.isRated = true;
    await this.bookingsRepository.save(booking);

    await this.refreshProviderReviewStats(booking.providerId);
    return savedReview;
  }

  async listMyReviews(userId: string, role: UserRole) {
    if (role === UserRole.PROVIDER) {
      return this.reviewsRepository.find({
        where: { providerUserId: userId },
        order: { createdAt: 'DESC' },
      });
    }

    return this.reviewsRepository.find({
      where: { customerId: userId },
      order: { createdAt: 'DESC' },
    });
  }

  async listProviderReviews(providerUserId: string) {
    return this.reviewsRepository.find({
      where: { providerUserId },
      order: { createdAt: 'DESC' },
    });
  }

  private async refreshProviderReviewStats(providerUserId: string) {
    const profile = await this.providerProfilesRepository.findOne({ where: { userId: providerUserId } });
    if (!profile) return;

    const reviews = await this.reviewsRepository.find({ where: { providerUserId } });
    const completedBookings = await this.bookingsRepository.count({
      where: { providerId: providerUserId, status: BookingStatus.COMPLETED },
    });

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    profile.averageRating = reviews.length == 0 ? 0 : Number((totalRating / reviews.length).toFixed(2));
    profile.totalJobsCompleted = completedBookings;
    await this.providerProfilesRepository.save(profile);
  }
}