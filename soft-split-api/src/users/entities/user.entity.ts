// src/users/entities/user.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToMany, JoinTable, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from 'typeorm';
import { Expense } from '../../expenses/entities/expense.entity';
import { Group } from '../../groups/entities/group.entity';
import { FriendRequest } from './friend-request.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ default: true })
  isActive: boolean;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @Column()
  @Index('IDX_USER_EMAIL_ACTIVE', { unique: true, where: "deleted_at IS NULL" })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  avatar: string;

  @OneToMany(() => Expense, expense => expense.paidBy)
  expensesPaid: Expense[];

  @ManyToMany(() => Expense)
  @JoinTable()
  expensesInvolved: Expense[];

  @ManyToMany(() => Group, group => group.members)
  groups: Group[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: false })
  isAdmin: boolean;

  @OneToMany(() => FriendRequest, request => request.sender)
  sentFriendRequests: FriendRequest[];

  @OneToMany(() => FriendRequest, request => request.receiver)
  receivedFriendRequests: FriendRequest[];

  @ManyToMany(() => User, user => user.friends)
  @JoinTable()
  friends: User[];
}