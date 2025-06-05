import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class FriendRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, user => user.sentFriendRequests)
  sender: User;

  @ManyToOne(() => User, user => user.receivedFriendRequests)
  receiver: User;

  @Column({ default: 'pending' })
  status: 'pending' | 'accepted' | 'rejected' | 'archived';

  @CreateDateColumn()
  createdAt: Date;
} 