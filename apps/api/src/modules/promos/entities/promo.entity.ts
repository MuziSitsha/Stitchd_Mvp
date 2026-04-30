import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PromoDiscountType {
  FLAT = 'flat',
  PERCENT = 'percent',
}

@Entity('promos')
@Index(['code'], { unique: true })
export class PromoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: PromoDiscountType, default: PromoDiscountType.FLAT })
  discountType: PromoDiscountType;

  @Column()
  discountValue: number;

  @Column({ nullable: true })
  maxDiscountCents: number;

  @Column({ default: 0 })
  minBookingAmountCents: number;

  @Column({ nullable: true })
  usageLimit: number;

  @Column({ default: 0 })
  usageCount: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  referralOnly: boolean;

  @Column({ nullable: true })
  startsAt: Date;

  @Column({ nullable: true })
  endsAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}