import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * A user-visible record of something that happened. Designed to be extensible:
 * the `type` column drives which `payload` shape the frontend renders.
 *
 * For now only one type ships:
 *   type='settlement'  payload = { settlementId, amount, note }
 *
 * `actor` is who took the action, `recipient` is the other party (optional —
 * future event types may not have one). A user's feed is every event where
 * actor.id = me OR recipient.id = me.
 */
@Entity()
@Index(['actor'])
@Index(['recipient'])
export class ActivityEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: string;

  @ManyToOne(() => User, { nullable: false, eager: true })
  actor: User;

  @ManyToOne(() => User, { nullable: true, eager: true })
  recipient: User;

  @Column('jsonb', { nullable: true })
  payload: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
