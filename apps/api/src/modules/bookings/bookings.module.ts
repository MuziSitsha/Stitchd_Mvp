import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminModule } from '../admin/admin.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsModule } from '../payments/payments.module';
import { PromosModule } from '../promos/promos.module';
import { UserEntity } from '../users/entities/user.entity';
import { WalletModule } from '../wallet/wallet.module';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { BookingEntity } from './entities/booking.entity';

@Module({
	imports: [
		TypeOrmModule.forFeature([BookingEntity, UserEntity]),
		AdminModule,
		NotificationsModule,
		PaymentsModule,
		PromosModule,
		WalletModule,
	],
	controllers: [BookingsController],
	providers: [BookingsService],
	exports: [BookingsService, TypeOrmModule],
})
export class BookingsModule {}