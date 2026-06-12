// src/expenses/entities/expense.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, ManyToMany, JoinTable, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Group } from '../../groups/entities/group.entity';

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'lodging'
  | 'entertainment'
  | 'utilities'
  | 'shopping'
  | 'other';

@Entity()
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column()
  date: Date;

  @ManyToOne(() => User, user => user.expensesPaid)
  paidBy: User;

  @ManyToMany(() => User)
  @JoinTable()
  participants: User[];

  @ManyToOne(() => Group, group => group.expenses, { nullable: true })
  group: Group;

  @Column({ default: 'equal' })
  splitType: string; // equal, percentage, exact

  @Column('json', { nullable: true })
  splitDetails: Record<string, number>; // user_id: amount or percentage

  // Phase 3 expense richness fields.
  @Column({ default: 'other' })
  category: ExpenseCategory;

  // ISO-4217 three-letter currency code. No FX conversion is performed; the
  // balance UI shows amounts in the currency they were entered in. Mixed
  // currencies in one group are undefined behaviour and surfaced visually.
  @Column({ length: 3, default: 'USD' })
  currency: string;

  @Column('text', { nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Migration 1774210604374 added expense.deleted_at; the entity was missing
  // the @DeleteDateColumn so TypeORM never auto-filtered soft-deleted rows
  // from regular find queries. Declaring it here closes that gap.
  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}