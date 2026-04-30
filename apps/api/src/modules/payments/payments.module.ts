import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingEntity } from '../bookings/entities/booking.entity';
import { UserEntity } from '../users/entities/user.entity';
import { WalletModule } from '../wallet/wallet.module';
import { PaymentsController } from './payments.controller';
import { PaymentTransactionEntity } from './entities/payment-transaction.entity';
import { PaymentsPublicController } from './payments.public.controller';
import { PaymentsService } from './payments.service';

@Module({
	imports: [
		ConfigModule,
		TypeOrmModule.forFeature([PaymentTransactionEntity, BookingEntity, UserEntity]),
		WalletModule,
	],
	controllers: [PaymentsController, PaymentsPublicController],
	providers: [PaymentsService],
	exports: [PaymentsService],
})
export class PaymentsModule {}