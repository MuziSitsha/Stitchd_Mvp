import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminModule } from '../admin/admin.module';
import { WeddingEventEntity } from '../planner/entities/wedding-event.entity';
import { WeddingVendorPaymentEntity } from '../planner/entities/wedding-vendor-payment.entity';
import { WeddingVendorSelectionEntity } from '../planner/entities/wedding-vendor-selection.entity';
import { UserEntity } from '../users/entities/user.entity';
import { PaymentsPublicController } from './payments.public.controller';
import { PaymentsService } from './payments.service';

@Module({
	imports: [
		ConfigModule,
		TypeOrmModule.forFeature([
			UserEntity,
			WeddingVendorPaymentEntity,
			WeddingVendorSelectionEntity,
			WeddingEventEntity,
		]),
		AdminModule,
	],
	controllers: [PaymentsPublicController],
	providers: [PaymentsService],
	exports: [PaymentsService],
})
export class PaymentsModule {}
