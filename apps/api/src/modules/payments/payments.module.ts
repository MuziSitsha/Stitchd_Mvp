import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminModule } from '../admin/admin.module';
import { BookingEntity } from '../bookings/entities/booking.entity';
import { WeddingEventEntity } from '../planner/entities/wedding-event.entity';
import { WeddingVendorPaymentEntity } from '../planner/entities/wedding-vendor-payment.entity';
import { WeddingVendorSelectionEntity } from '../planner/entities/wedding-vendor-selection.entity';
import { UserEntity } from '../users/entities/user.entity';
import { WalletModule } from '../wallet/wallet.module';
import { PaymentsController } from './payments.controller';
import { PaymentTransactionEntity } from './entities/payment-transaction.entity';
import { PaymentsPublicController } from './payments.public.controller';
import { PaymentsService } from './payments.service';

@Module({
	imports: [
		ConfigModule,
		TypeOrmModule.forFeature([
			PaymentTransactionEntity,
			BookingEntity,
			UserEntity,
			WeddingVendorPaymentEntity,
			WeddingVendorSelectionEntity,
			WeddingEventEntity,
		]),
		WalletModule,
		AdminModule,
	],
	controllers: [PaymentsController, PaymentsPublicController],
	providers: [PaymentsService],
	exports: [PaymentsService],
})
export class PaymentsModule {}