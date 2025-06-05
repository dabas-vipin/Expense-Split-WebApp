// src/expenses/entities/expense.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, ManyToMany, JoinTable, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Group } from '../../groups/entities/group.entity';

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}