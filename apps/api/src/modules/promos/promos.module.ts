import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { WalletModule } from '../wallet/wallet.module';
import { PromoRedemptionEntity } from './entities/promo-redemption.entity';
import { PromoEntity } from './entities/promo.entity';
import { PromosController } from './promos.controller';
import { PromosService } from './promos.service';

@Module({
	imports: [TypeOrmModule.forFeature([PromoEntity, PromoRedemptionEntity, UserEntity]), WalletModule],
	controllers: [PromosController],
	providers: [PromosService],
	exports: [PromosService],
})
export class PromosModule {}