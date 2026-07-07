import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WeddingEventType } from './wedding-event.entity';

@Entity('wedding_vendors')
@Index(['slot'])
export class WeddingVendorEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: WeddingEventType, default: WeddingEventType.WEDDING })
  eventType: WeddingEventType;

  @Column()
  slot: string;

  @Column({ nullable: true })
  subcategory: string;

  @Column()
  name: string;

  @Column()
  priceLabel: string;

  @Column({ default: 0 })
  priceCents: number;

  @Column('decimal', { precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ default: 0 })
  reviewCount: number;

  @Column({ nullable: true })
  imageKey: string;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @Column({ default: false })
  isRecommended: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
