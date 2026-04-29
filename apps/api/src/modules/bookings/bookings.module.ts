import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { BookingEntity } from './entities/booking.entity';

@Module({
	imports: [TypeOrmModule.forFeature([BookingEntity, UserEntity])],
	controllers: [BookingsController],
	providers: [BookingsService],
	exports: [BookingsService, TypeOrmModule],
})
export class BookingsModule {}