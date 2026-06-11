import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Group } from '../../groups/entities/group.entity';
import { User } from '../../users/entities/user.entity';

export type GroupInvitationStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'cancelled';

/**
 * Bridges the friendship gap: lets a group member invite a non-friend (or any
 * user) to join the group. Direct addMember keeps requiring friendship —
 * invitations are the explicit consent flow for everyone else.
 *
 * `status` is intentionally a string instead of a Postgres enum so adding a
 * new state (e.g. `expired`) later doesn't require a schema migration.
 */
@Entity('group_invitation')
@Index(['invitee', 'status'])
@Index(['group', 'status'])
export class GroupInvitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Group, { nullable: false, eager: true })
  group: Group;

  @ManyToOne(() => User, { nullable: false, eager: true })
  inviter: User;

  @ManyToOne(() => User, { nullable: false, eager: true })
  invitee: User;

  @Column({ default: 'pending' })
  status: GroupInvitationStatus;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true, type: 'timestamp' })
  respondedAt: Date | null;
}
