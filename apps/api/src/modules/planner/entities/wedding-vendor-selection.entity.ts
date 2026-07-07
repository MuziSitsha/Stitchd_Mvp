import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WeddingEventEntity } from './wedding-event.entity';

export enum WeddingVendorStatus {
  SECURED = 'secured',
  BOOKED = 'booked',
  OPTIONAL = 'optional',
  RECOMMENDED = 'recommended',
  AT_RISK = 'at_risk',
  SHORTLISTED = 'shortlisted',
}

@Entity('wedding_vendor_selections')
@Index(['weddingEventId'])
export class WeddingVendorSelectionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  weddingEventId: string;

  @ManyToOne(() => WeddingEventEntity)
  @JoinColumn({ name: 'weddingEventId' })
  weddingEvent: WeddingEventEntity;

  @Column()
  slot: string;

  @Column({ nullable: true })
  subcategory: string;

  @Column()
  vendorName: string;

  @Column({ nullable: true })
  vendorId: string;

  @Column({ default: 0 })
  priceCents: number;

  @Column({ default: 0 })
  amountPaidCents: number;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  @Column({
    type: 'enum',
    enum: WeddingVendorStatus,
    default: WeddingVendorStatus.SHORTLISTED,
  })
  status: WeddingVendorStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
