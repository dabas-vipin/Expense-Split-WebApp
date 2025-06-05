// src/groups/groups.controller.ts
import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Request, ForbiddenException, BadRequestException } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { Group } from './entities/group.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateGroupDto } from './dto/create-group.dto';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Request() req) {
    return this.groupsService.findAllForUser(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('user')
  async findByUser(@Request() req): Promise<Group[]> {
    return this.groupsService.findByUser(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Group> {
    if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      throw new BadRequestException('Invalid group ID format');
    }
    return this.groupsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() groupData: CreateGroupDto, @Request() req): Promise<Group> {
    return this.groupsService.create(groupData, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(@Param('id') id: string, @Body() groupData: any): Promise<Group> {
    return this.groupsService.update(id, groupData);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/members/:userId')
  async addMember(@Param('id') id: string, @Param('userId') userId: string): Promise<Group> {
    return this.groupsService.addMember(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/members/:userId')
  async removeMember(@Param('id') id: string, @Param('userId') userId: string): Promise<Group> {
    return this.groupsService.removeMember(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.groupsService.remove(id);
  }
}