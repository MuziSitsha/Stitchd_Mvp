import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';

export enum ProviderVerificationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('provider_profiles')
@Index(['userId'], { unique: true })
export class ProviderProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @OneToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ nullable: true })
  serviceArea: string;

  @Column({ default: 0 })
  yearsExperience: number;

  @Column({ type: 'simple-array', nullable: true })
  serviceCategoryIds: string[];

  @Column({ default: false })
  isAvailable: boolean;

  @Column({ default: false })
  documentsSubmitted: boolean;

  @Column({ default: false })
  backgroundCheckCompleted: boolean;

  @Column({
    type: 'enum',
    enum: ProviderVerificationStatus,
    default: ProviderVerificationStatus.PENDING,
  })
  verificationStatus: ProviderVerificationStatus;

  @Column('decimal', { precision: 3, scale: 2, default: 0 })
  averageRating: number;

  @Column({ default: 0 })
  totalJobsCompleted: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}