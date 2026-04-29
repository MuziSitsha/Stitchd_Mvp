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
import { ServiceCategoryEntity } from './service-category.entity';

@Entity('services')
@Index(['slug'], { unique: true })
export class ServiceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  categoryId: string;

  @ManyToOne(() => ServiceCategoryEntity)
  @JoinColumn({ name: 'categoryId' })
  category: ServiceCategoryEntity;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 0 })
  basePriceCents: number;

  @Column({ default: 60 })
  estimatedDurationMinutes: number;

  @Column({ default: true })
  supportsInstantBooking: boolean;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}