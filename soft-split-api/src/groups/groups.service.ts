// src/groups/groups.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './entities/group.entity';
import { UsersService } from '../users/users.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

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
    if (!groupData.memberIds || groupData.memberIds.length < 2) {
      throw new BadRequestException('A group must have at least 2 members');
    }

    const creator = await this.usersService.findOne(creatorId);
    if (!creator) {
      throw new NotFoundException('Creator user not found');
    }

    await this.validateProspectiveMembers(groupData.memberIds, creatorId);

    if (!groupData.memberIds.includes(creatorId)) {
      groupData.memberIds.push(creatorId);
    }

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

  async update(id: string, groupData: UpdateGroupDto, callerId: string): Promise<Group> {
    const group = await this.findOne(id);
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (groupData.name !== undefined) {
      group.name = groupData.name;
    }

    if (groupData.description !== undefined) {
      group.description = groupData.description;
    }

    if (groupData.memberIds !== undefined) {
      await this.validateProspectiveMembers(groupData.memberIds, callerId);

      const uniqueIds = [...new Set(groupData.memberIds)];
      if (uniqueIds.length < 2) {
        throw new BadRequestException('A group must have at least 2 unique members');
      }

      group.members = await Promise.all(
        uniqueIds.map(memberId => this.usersService.findOne(memberId)),
      );
    }

    return this.groupsRepository.save(group);
  }

  async addMember(id: string, userId: string, callerId: string): Promise<Group> {
    const group = await this.findOne(id);
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    await this.validateProspectiveMembers([userId], callerId);

    if (!group.members.some(member => member.id === userId)) {
      const user = await this.usersService.findOne(userId);
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
    await this.groupsRepository.softDelete(id);
  }

  // Verifies every prospective member (other than the caller themselves) exists,
  // is active, and is a friend of the caller. Mirrors the invariant create()
  // enforces, so update()/addMember() can keep it too.
  private async validateProspectiveMembers(memberIds: string[], callerId: string): Promise<void> {
    const friendsList = await this.usersService.getFriendsList(callerId);
    const friendIds = new Set(friendsList.map(friend => friend.id));

    for (const memberId of memberIds) {
      if (memberId === callerId) continue;
      const member = await this.usersService.findOne(memberId);
      if (!member) {
        throw new BadRequestException(`User with ID ${memberId} does not exist`);
      }
      if (!member.isActive) {
        throw new BadRequestException(`User with ID ${memberId} is not active`);
      }
      if (!friendIds.has(memberId)) {
        throw new BadRequestException(`User with ID ${memberId} is not in your friends list`);
      }
    }
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