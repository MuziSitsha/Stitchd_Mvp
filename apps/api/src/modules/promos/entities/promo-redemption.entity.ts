import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('promo_redemptions')
@Index(['promoId', 'userId'])
export class PromoRedemptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  promoId: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  bookingId: string;

  @Column({ default: 0 })
  discountCents: number;

  @CreateDateColumn()
  createdAt: Date;
}