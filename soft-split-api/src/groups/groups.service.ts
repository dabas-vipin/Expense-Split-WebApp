// src/groups/groups.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './entities/group.entity';
import { UsersService } from '../users/users.service';
import { CreateGroupDto } from './dto/create-group.dto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private groupsRepository: Repository<Group>,
    private usersService: UsersService,
  ) {}

  async findAll(): Promise<Group[]> {
    return this.groupsRepository.find({
      relations: ['members'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: string): Promise<Group> {
    return this.groupsRepository.findOne({
      where: { id },
      relations: ['members', 'expenses', 'expenses.paidBy', 'expenses.participants'],
    });
  }

  async findByUser(userId: string): Promise<Group[]> {
    console.log('Finding groups for user:', userId);
    return this.groupsRepository.find({
      relations: ['members'],
      where: {
        members: {
          id: userId
        }
      }
    });
  }

  async create(groupData: CreateGroupDto, creatorId: string): Promise<Group> {
    // Validate minimum members requirement
    if (!groupData.memberIds || groupData.memberIds.length < 2) {
      throw new BadRequestException('A group must have at least 2 members');
    }

    // Validate UUID format
    const isValidUUID = (uuid: string) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidRegex.test(uuid);
    };

    if (!groupData.memberIds.every(isValidUUID)) {
      throw new BadRequestException('Invalid member ID format provided');
    }

    // Validate creator exists
    const creator = await this.usersService.findOne(creatorId);
    if (!creator) {
      throw new NotFoundException('Creator user not found');
    }

    // Get creator's friends list
    const friendsList = await this.usersService.getFriendsList(creatorId);
    const friendIds = friendsList.map(friend => friend.id);

    // Validate all members exist and are friends with creator
    for (const memberId of groupData.memberIds) {
      if (memberId !== creatorId) {  // Skip creator validation
        const member = await this.usersService.findOne(memberId);
        if (!member) {
          throw new BadRequestException(`User with ID ${memberId} does not exist`);
        }
        if (!friendIds.includes(memberId)) {
          throw new BadRequestException(`User with ID ${memberId} is not in your friends list`);
        }
        if (!member.isActive) {
          throw new BadRequestException(`User with ID ${memberId} is not active`);
        }
      }
    }

    // Ensure creator is in members list
    if (!groupData.memberIds.includes(creatorId)) {
      groupData.memberIds.push(creatorId);
    }

    // Get all validated members
    const members = await Promise.all(
      groupData.memberIds.map(id => this.usersService.findOne(id))
    );

    const uniqueMembers = [...new Set(members)];

    if (uniqueMembers.length < 2) {
      throw new BadRequestException('A group must have at least 2 unique members');
    }

    const group = this.groupsRepository.create({
      name: groupData.name,
      description: groupData.description,
      members: uniqueMembers,
    });

    return this.groupsRepository.save(group);
  }

  async update(id: string, groupData: Group): Promise<Group> {
    const group = await this.findOne(id);
    
    if (groupData.name) {
      group.name = groupData.name;
    }
    
    if (groupData.description) {
      group.description = groupData.description;
    }
    
    // Update members if provided
    if (groupData.members && groupData.members.length > 0) {
      group.members = await Promise.all(
        groupData.members.map(member => this.usersService.findOne(member.id)),
      );
    }
    
    return this.groupsRepository.save(group);
  }

  async addMember(id: string, userId: string): Promise<Group> {
    const group = await this.findOne(id);
    const user = await this.usersService.findOne(userId);
    
    if (!group.members.some(member => member.id === userId)) {
      group.members.push(user);
      await this.groupsRepository.save(group);
    }
    
    return this.findOne(id);
  }

  async removeMember(id: string, userId: string): Promise<Group> {
    const group = await this.findOne(id);
    group.members = group.members.filter(member => member.id !== userId);
    await this.groupsRepository.save(group);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.groupsRepository.delete(id);
  }

  async findAllForUser(userId: string): Promise<Group[]> {
    return this.groupsRepository
      .createQueryBuilder('group')
      .leftJoinAndSelect('group.members', 'members')
      .where(qb => {
        const subQuery = qb
          .subQuery()
          .select('group_members_user.groupId')
          .from('group_members_user', 'group_members_user')
          .where('group_members_user.userId = :userId')
          .getQuery();
        return 'group.id IN ' + subQuery;
      })
      .setParameter('userId', userId)
      .orderBy('group.createdAt', 'DESC')
      .getMany();
  }
}