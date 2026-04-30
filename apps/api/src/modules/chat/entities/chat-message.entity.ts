import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum ChatMessageType {
  TEXT = 'text',
  CALL_LOG = 'call_log',
}

@Entity('chat_messages')
@Index(['bookingId', 'createdAt'])
export class ChatMessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  bookingId: string;

  @Column()
  senderId: string;

  @Column()
  recipientId: string;

  @Column({ type: 'enum', enum: ChatMessageType, default: ChatMessageType.TEXT })
  messageType: ChatMessageType;

  @Column({ type: 'text' })
  message: string;

  @Column({ nullable: true })
  callStatus: string;

  @CreateDateColumn()
  createdAt: Date;
}