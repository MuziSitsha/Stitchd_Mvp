import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '../../users/entities/user.entity';

@Entity('reviews')
@Index(['bookingId', 'reviewerUserId'], { unique: true })
@Index(['providerUserId'])
@Index(['customerId'])
@Index(['revieweeUserId'])
@Index(['reviewerUserId'])
export class ReviewEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  bookingId: string;

  @Column()
  customerId: string;

  @Column()
  providerUserId: string;

  @Column()
  reviewerUserId: string;

  @Column({ type: 'enum', enum: UserRole })
  reviewerRole: UserRole;

  @Column()
  revieweeUserId: string;

  @Column({ type: 'enum', enum: UserRole })
  revieweeRole: UserRole;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}