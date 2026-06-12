// src/users/users.controller.ts
import { Controller, Get, Post, Body, Param, Put, Patch, Delete, UploadedFile, UseGuards, UseInterceptors, Request, ForbiddenException, Query, BadRequestException, HttpCode } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
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

  // --- "me" routes: operate on the current user, no UUID needed in the path ---
  // These exist alongside the older /users/:id routes which still work for
  // admin-style flows. The frontend Profile page targets these.

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateMe(@Request() req, @Body() dto: UpdateMeDto): Promise<User> {
    return this.usersService.updateMe(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/password')
  @HttpCode(204)
  async updatePassword(
    @Request() req,
    @Body() dto: UpdatePasswordDto,
  ): Promise<void> {
    await this.usersService.updatePassword(
      req.user.id,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  // Multer in-memory storage: small file, we write to disk ourselves in the
  // service so the path / filename logic stays in one place.
  @UseGuards(JwtAuthGuard)
  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    }),
  )
  async uploadAvatar(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<User> {
    if (!file) {
      throw new BadRequestException(
        'Send the image as form-data field "avatar"',
      );
    }
    return this.usersService.saveAvatar(req.user.id, file.buffer, file.mimetype);
  }

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