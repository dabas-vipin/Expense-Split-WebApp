import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { GroupInvitationsService } from './group-invitations.service';
import { GroupInvitation } from './entities/group-invitation.entity';
import { GroupsService } from '../groups/groups.service';
import { UsersService } from '../users/users.service';
import { ActivityService } from '../activity/activity.service';

describe('GroupInvitationsService', () => {
  let service: GroupInvitationsService;
  let invitationsRepo: any;
  let groupsService: any;
  let usersService: any;
  let activityService: any;

  const alice = { id: 'alice', name: 'Alice', email: 'a@x.com', isActive: true };
  const bob = { id: 'bob', name: 'Bob', email: 'b@x.com', isActive: true };
  const charlie = {
    id: 'charlie',
    name: 'Charlie',
    email: 'c@x.com',
    isActive: true,
  };
  const baseGroup = (members: any[] = [alice]) => ({
    id: 'g1',
    name: 'Trip',
    members,
  });

  beforeEach(async () => {
    invitationsRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((data) => data),
      save: jest.fn((data) =>
        Promise.resolve({ id: 'inv1', createdAt: new Date(), ...data }),
      ),
    };
    groupsService = {
      findOne: jest.fn(),
      addMemberFromInvitation: jest.fn().mockResolvedValue({}),
    };
    usersService = {
      findOne: jest.fn(),
      findByEmail: jest.fn(),
    };
    activityService = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupInvitationsService,
        {
          provide: getRepositoryToken(GroupInvitation),
          useValue: invitationsRepo,
        },
        { provide: GroupsService, useValue: groupsService },
        { provide: UsersService, useValue: usersService },
        { provide: ActivityService, useValue: activityService },
      ],
    }).compile();

    service = module.get<GroupInvitationsService>(GroupInvitationsService);
  });

  describe('invite', () => {
    it('rejects when the caller is not a member of the group', async () => {
      groupsService.findOne.mockResolvedValue(baseGroup([alice]));
      await expect(
        service.invite('g1', 'charlie', 'b@x.com'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects when no active Soft Split user has that email', async () => {
      groupsService.findOne.mockResolvedValue(baseGroup([alice]));
      usersService.findByEmail.mockResolvedValue(null);
      await expect(
        service.invite('g1', 'alice', 'ghost@x.com'),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects when the invitee is already a group member', async () => {
      groupsService.findOne.mockResolvedValue(baseGroup([alice, bob]));
      usersService.findByEmail.mockResolvedValue(bob);
      await expect(
        service.invite('g1', 'alice', 'b@x.com'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.invite('g1', 'alice', 'b@x.com'),
      ).rejects.toThrow(/already a member/);
    });

    it('rejects when a pending invitation already exists', async () => {
      groupsService.findOne.mockResolvedValue(baseGroup([alice]));
      usersService.findByEmail.mockResolvedValue(charlie);
      invitationsRepo.findOne.mockResolvedValue({ id: 'existing' });
      await expect(
        service.invite('g1', 'alice', 'c@x.com'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.invite('g1', 'alice', 'c@x.com'),
      ).rejects.toThrow(/already exists/);
    });

    it('persists a new pending invitation on the happy path', async () => {
      groupsService.findOne.mockResolvedValue(baseGroup([alice]));
      usersService.findByEmail.mockResolvedValue(charlie);
      invitationsRepo.findOne.mockResolvedValue(null);
      usersService.findOne.mockResolvedValue(alice);

      const result = await service.invite('g1', 'alice', 'c@x.com');

      expect(invitationsRepo.save).toHaveBeenCalled();
      const saved = invitationsRepo.save.mock.calls[0][0];
      expect(saved.status).toBe('pending');
      expect(saved.inviter.id).toBe('alice');
      expect(saved.invitee.id).toBe('charlie');
      expect(result).toMatchObject({ id: 'inv1' });
    });
  });

  describe('respond', () => {
    it('rejects when the caller is not the invitee', async () => {
      invitationsRepo.findOne.mockResolvedValue({
        id: 'inv1',
        status: 'pending',
        invitee: { id: 'charlie' },
        inviter: { id: 'alice' },
        group: { id: 'g1' },
      });
      await expect(service.respond('inv1', 'alice', true)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('rejects when the invitation is no longer pending', async () => {
      invitationsRepo.findOne.mockResolvedValue({
        id: 'inv1',
        status: 'accepted',
        invitee: { id: 'charlie' },
        inviter: { id: 'alice' },
        group: { id: 'g1' },
      });
      await expect(service.respond('inv1', 'charlie', true)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('on accept: marks accepted and adds the invitee to the group (no friendship check)', async () => {
      invitationsRepo.findOne.mockResolvedValue({
        id: 'inv1',
        status: 'pending',
        invitee: { id: 'charlie' },
        inviter: { id: 'alice' },
        group: { id: 'g1' },
      });

      const result = await service.respond('inv1', 'charlie', true);

      expect(result.status).toBe('accepted');
      expect(groupsService.addMemberFromInvitation).toHaveBeenCalledWith(
        'g1',
        'charlie',
      );
    });

    it('on reject: marks rejected and does NOT add the invitee to the group', async () => {
      invitationsRepo.findOne.mockResolvedValue({
        id: 'inv1',
        status: 'pending',
        invitee: { id: 'charlie' },
        inviter: { id: 'alice' },
        group: { id: 'g1' },
      });

      const result = await service.respond('inv1', 'charlie', false);

      expect(result.status).toBe('rejected');
      expect(groupsService.addMemberFromInvitation).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('rejects when caller is neither the inviter nor a current group member', async () => {
      invitationsRepo.findOne.mockResolvedValue({
        id: 'inv1',
        status: 'pending',
        inviter: { id: 'alice' },
        group: { id: 'g1' },
      });
      groupsService.findOne.mockResolvedValue(baseGroup([alice]));
      await expect(service.cancel('inv1', 'charlie')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('allows a group member (not the original inviter) to cancel a pending invitation', async () => {
      invitationsRepo.findOne.mockResolvedValue({
        id: 'inv1',
        status: 'pending',
        inviter: { id: 'alice' },
        group: { id: 'g1' },
      });
      groupsService.findOne.mockResolvedValue(baseGroup([alice, bob]));
      await service.cancel('inv1', 'bob');
      expect(invitationsRepo.save).toHaveBeenCalled();
      expect(invitationsRepo.save.mock.calls[0][0].status).toBe('cancelled');
    });
  });
});
