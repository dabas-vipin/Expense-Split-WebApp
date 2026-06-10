import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * A payment from one user to another that reduces the payer's debt to the
 * payee. Cross-group: no groupId — settlements net against the overall
 * user-to-user balance, not against a single group's expenses.
 *
 * Amount is positive (decimal(10,2)). Partial settlements are explicit:
 * the payer chooses how much they're paying.
 */
@Entity()
@Index(['payer'])
@Index(['payee'])
export class Settlement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: false, eager: true })
  payer: User;

  @ManyToOne(() => User, { nullable: false, eager: true })
  payee: User;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: string;

  @Column({ nullable: true })
  note: string;

  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
