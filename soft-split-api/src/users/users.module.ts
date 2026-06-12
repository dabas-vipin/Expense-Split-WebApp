// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { FriendRequest } from './entities/friend-request.entity';
import { UsersService } from './users.service';
import { FriendsService } from './friends.service';
import { UsersController } from './users.controller';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, FriendRequest]), ActivityModule],
  providers: [UsersService, FriendsService],
  controllers: [UsersController],
  exports: [UsersService, FriendsService],
})
export class UsersModule {}