// src/groups/entities/group.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, JoinTable, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Expense } from '../../expenses/entities/expense.entity';

@Entity()
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @ManyToMany(() => User, user => user.groups)
  @JoinTable()
  members: User[];

  @OneToMany(() => Expense, expense => expense.group)
  expenses: Expense[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}