import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoachProfileEntity } from '../planner/entities/coach-profile.entity';
import { WeddingEventEntity } from '../planner/entities/wedding-event.entity';
import { WeddingVendorEntity } from '../planner/entities/wedding-vendor.entity';
import { WeddingVendorPaymentEntity } from '../planner/entities/wedding-vendor-payment.entity';
import { WeddingVendorProfileEntity } from '../planner/entities/wedding-vendor-profile.entity';
import { WeddingVendorSelectionEntity } from '../planner/entities/wedding-vendor-selection.entity';
import { UserEntity } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PlatformSettingsEntity } from './entities/platform-settings.entity';

@Module({
	imports: [
		ConfigModule,
		UsersModule,
		TypeOrmModule.forFeature([
			PlatformSettingsEntity,
			UserEntity,
			WeddingEventEntity,
			WeddingVendorSelectionEntity,
			WeddingVendorEntity,
			WeddingVendorPaymentEntity,
			WeddingVendorProfileEntity,
			CoachProfileEntity,
		]),
	],
	controllers: [AdminController],
	providers: [AdminService],
	exports: [AdminService],
})
export class AdminModule {}
