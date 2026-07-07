import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsModule } from '../payments/payments.module';
import { UserEntity } from '../users/entities/user.entity';
import { CoachProfileEntity } from './entities/coach-profile.entity';
import { WeddingEventEntity } from './entities/wedding-event.entity';
import { WeddingInspirationNoteEntity } from './entities/wedding-inspiration-note.entity';
import { WeddingMessageEntity } from './entities/wedding-message.entity';
import { WeddingVendorEntity } from './entities/wedding-vendor.entity';
import { WeddingVendorMessageEntity } from './entities/wedding-vendor-message.entity';
import { WeddingVendorProfileEntity } from './entities/wedding-vendor-profile.entity';
import { WeddingVendorSelectionEntity } from './entities/wedding-vendor-selection.entity';
import { PlannerController } from './planner.controller';
import { PlannerService } from './planner.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WeddingEventEntity,
      CoachProfileEntity,
      WeddingVendorSelectionEntity,
      WeddingVendorEntity,
      WeddingVendorProfileEntity,
      WeddingVendorMessageEntity,
      WeddingInspirationNoteEntity,
      WeddingMessageEntity,
      UserEntity,
    ]),
    PaymentsModule,
  ],
  controllers: [PlannerController],
  providers: [PlannerService],
  exports: [PlannerService],
})
export class PlannerModule {}
