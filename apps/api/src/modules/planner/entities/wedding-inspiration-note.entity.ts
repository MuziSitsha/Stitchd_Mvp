import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('wedding_inspiration_notes')
@Index(['weddingEventId'])
export class WeddingInspirationNoteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  weddingEventId: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  note: string;

  @CreateDateColumn()
  createdAt: Date;
}
