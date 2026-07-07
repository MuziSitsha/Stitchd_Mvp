import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum WeddingVendorMessageSenderRole {
  CLIENT = 'client',
  VENDOR = 'vendor',
}

@Entity('wedding_vendor_messages')
@Index(['vendorSelectionId', 'createdAt'])
export class WeddingVendorMessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  vendorSelectionId: string;

  @Column()
  senderUserId: string;

  @Column({ type: 'enum', enum: WeddingVendorMessageSenderRole })
  senderRole: WeddingVendorMessageSenderRole;

  @Column({ type: 'text' })
  message: string;

  @CreateDateColumn()
  createdAt: Date;
}
