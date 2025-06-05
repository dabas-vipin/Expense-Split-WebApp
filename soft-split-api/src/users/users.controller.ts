// src/users/users.controller.ts
import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Request, ForbiddenException, Query, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { FriendsService } from './friends.service';

/**
 * TODO: Add password update endpoint with 2FA
 * - Create separate endpoint for password updates
 * - Implement 2-factor authentication
 * - Require current password verification
 * - Send verification code via email
 * - Rate limit password change attempts
 * - Log password change events
 */

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly friendsService: FriendsService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('search')
  async searchUser(
    @Query('email') email: string,
    @Request() req
  ) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    if (email === req.user.email) {
      throw new BadRequestException('Cannot search for your own email');
    }

    return this.friendsService.searchUserByEmail(email);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Request() req): Promise<User[]> {
    if (!req.user.isAdmin) {
      throw new ForbiddenException('Only administrators can access all users');
    }
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req): Promise<User> {
    if (!req.user.isAdmin && req.user.id !== id) {
      throw new ForbiddenException('You can only access your own user information');
    }
    return this.usersService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(
    @Param('id') id: string, 
    @Body() userData: UpdateUserDto,
    @Request() req
  ): Promise<User> {
    if (!req.user.isAdmin && req.user.id !== id) {
      throw new ForbiddenException('You can only update your own user information');
    }
    return this.usersService.update(id, userData);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req): Promise<void> {
    if (!req.user.isAdmin && req.user.id !== id) {
      throw new ForbiddenException('You can only delete your own user account');
    }
    return this.usersService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('friends/request')
  async sendFriendRequest(
    @Request() req,
    @Body('receiverEmail') receiverEmail: string
  ) {
    console.log('Received request with email:', receiverEmail); // Debug log
    
    if (!receiverEmail) {
      throw new BadRequestException('Receiver email is required');
    }
    
    return this.friendsService.sendFriendRequest(req.user.id, receiverEmail);
  }

  @UseGuards(JwtAuthGuard)
  @Post('friends/request/:requestId')
  async respondToFriendRequest(
    @Request() req,
    @Param('requestId') requestId: string,
    @Body('accept') accept: boolean
  ) {
    return this.friendsService.respondToFriendRequest(req.user.id, requestId, accept);
  }

  @UseGuards(JwtAuthGuard)
  @Get('friends/list')
  async getFriends(@Request() req) {
    return this.friendsService.getFriends(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('friends/requests/pending')
  async getPendingRequests(@Request() req) {
    return this.friendsService.getPendingRequests(req.user.id);
  }
}