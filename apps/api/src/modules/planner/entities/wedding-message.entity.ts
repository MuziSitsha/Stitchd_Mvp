import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum WeddingMessageSenderRole {
  CLIENT = 'client',
  COACH = 'coach',
}

@Entity('wedding_messages')
@Index(['weddingEventId', 'createdAt'])
export class WeddingMessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  weddingEventId: string;

  @Column()
  senderUserId: string;

  @Column({ type: 'enum', enum: WeddingMessageSenderRole })
  senderRole: WeddingMessageSenderRole;

  @Column({ type: 'text' })
  message: string;

  @CreateDateColumn()
  createdAt: Date;
}
