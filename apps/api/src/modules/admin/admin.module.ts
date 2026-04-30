import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingEntity } from '../bookings/entities/booking.entity';
import { PaymentTransactionEntity } from '../payments/entities/payment-transaction.entity';
import { ProviderDocumentEntity } from '../providers/entities/provider-document.entity';
import { ProviderProfileEntity } from '../providers/entities/provider-profile.entity';
import { ReviewEntity } from '../reviews/entities/review.entity';
import { UserEntity } from '../users/entities/user.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PlatformSettingsEntity } from './entities/platform-settings.entity';

@Module({
	imports: [
		ConfigModule,
		TypeOrmModule.forFeature([
			PlatformSettingsEntity,
			UserEntity,
			ProviderProfileEntity,
			ProviderDocumentEntity,
			BookingEntity,
			PaymentTransactionEntity,
			ReviewEntity,
		]),
	],
	controllers: [AdminController],
	providers: [AdminService],
	exports: [AdminService],
})
export class AdminModule {}