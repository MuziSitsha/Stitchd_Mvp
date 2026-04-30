import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingEntity } from '../bookings/entities/booking.entity';
import { ProviderProfileEntity } from '../providers/entities/provider-profile.entity';
import { ReviewEntity } from './entities/review.entity';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
	imports: [TypeOrmModule.forFeature([ReviewEntity, BookingEntity, ProviderProfileEntity])],
	controllers: [ReviewsController],
	providers: [ReviewsService],
	exports: [ReviewsService],
})
export class ReviewsModule {}