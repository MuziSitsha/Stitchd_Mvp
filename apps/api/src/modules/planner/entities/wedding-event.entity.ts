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
import { UserEntity } from '../../users/entities/user.entity';

export enum WeddingEventType {
  WEDDING = 'wedding',
  LOBOLA = 'lobola',
  FUNERAL = 'funeral',
  CORPORATE = 'corporate',
  BIRTHDAY = 'birthday',
}

export enum WeddingTimelineStatus {
  ON_TRACK = 'on_track',
  BEHIND = 'behind',
  AT_RISK = 'at_risk',
}

@Entity('wedding_events')
@Index(['ownerUserId'], { unique: true })
export class WeddingEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  ownerUserId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'ownerUserId' })
  owner: UserEntity;

  @Column({ type: 'enum', enum: WeddingEventType, default: WeddingEventType.WEDDING })
  eventType: WeddingEventType;

  @Column({ nullable: true })
  title: string;

  @Column({ type: 'date', nullable: true })
  eventDate: string;

  @Column({ default: 0 })
  budgetTotalCents: number;

  @Column({ nullable: true })
  locationLabel: string;

  @Column('double precision', { nullable: true })
  venueLat: number;

  @Column('double precision', { nullable: true })
  venueLng: number;

  @Column({ nullable: true })
  coachUserId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'coachUserId' })
  coach: UserEntity;

  @Column({
    type: 'enum',
    enum: WeddingTimelineStatus,
    default: WeddingTimelineStatus.ON_TRACK,
  })
  timelineStatus: WeddingTimelineStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
