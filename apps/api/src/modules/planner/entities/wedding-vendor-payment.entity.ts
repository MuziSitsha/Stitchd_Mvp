import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PaymentStatus } from '../../payments/payment-status.enum';

@Entity('wedding_vendor_payments')
@Index(['vendorSelectionId'])
@Index(['weddingEventId'])
@Index(['customerId'])
export class WeddingVendorPaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  vendorSelectionId: string;

  @Column()
  weddingEventId: string;

  @Column()
  customerId: string;

  @Column()
  amountCents: number;

  @Column({ default: 0 })
  commissionCents: number;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({ nullable: true })
  checkoutId: string;

  @Column({ nullable: true })
  checkoutUrl: string;

  @Column({ nullable: true })
  gatewayReference: string;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ nullable: true })
  settledAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
