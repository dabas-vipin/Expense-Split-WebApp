// src/users/users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { DataSource } from 'typeorm';
import { FriendRequest } from '../users/entities/friend-request.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(FriendRequest)
    private friendRequestRepository: Repository<FriendRequest>,
    private dataSource: DataSource
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOne(id: string): Promise<User> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(userData);
    return this.usersRepository.save(user);
  }

  async update(id: string, userData: UpdateUserDto): Promise<User> {
    await this.usersRepository.update(id, userData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    return this.softDelete(id).then(() => {});
  }

  async softDelete(id: string) {
    return this.dataSource.transaction(async manager => {
      const user = await manager.findOne(User, {
        where: { id },
        relations: ['groups', 'expensesInvolved', 'expensesPaid']
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Update user status
      user.isActive = false;
      user.email = `deleted_${user.email}_${Date.now()}`; // Ensure email can be reused
      await manager.save(User, user);

      // Archive friend requests
      await manager
        .createQueryBuilder()
        .update(FriendRequest)
        .set({ status: 'archived' })
        .where('senderId = :id OR receiverId = :id', { id })
        .execute();

      return { message: 'User deactivated successfully' };
    });
  }

  async getFriendsList(userId: string): Promise<User[]> {
    const user = await this.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.usersRepository.find({
      where: { friends: { id: userId } },
      relations: ['friends']
    });
  }
}