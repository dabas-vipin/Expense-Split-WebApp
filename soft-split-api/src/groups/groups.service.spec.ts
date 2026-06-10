import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { Group } from './entities/group.entity';
import { UsersService } from '../users/users.service';

describe('GroupsService', () => {
  let service: GroupsService;
  let groupsRepository: any;
  let usersService: any;

  const alice = { id: 'alice', name: 'Alice', isActive: true };
  const bob = { id: 'bob', name: 'Bob', isActive: true };
  const charlie = { id: 'charlie', name: 'Charlie', isActive: true };

  beforeEach(async () => {
    groupsRepository = {
      findOne: jest.fn(),
      create: jest.fn((data) => data),
      save: jest.fn((data) => Promise.resolve({ id: 'g1', ...data })),
      softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    usersService = {
      findOne: jest.fn(),
      getFriendsList: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupsService,
        { provide: getRepositoryToken(Group), useValue: groupsRepository },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    service = module.get<GroupsService>(GroupsService);
  });

  describe('create - friendship validation', () => {
    it('creates a group when every prospective member is a friend of the creator', async () => {
      usersService.findOne.mockImplementation((id: string) => {
        return Promise.resolve({ alice, bob }[id] || null);
      });
      usersService.getFriendsList.mockResolvedValue([bob]);

      const result = await service.create(
        { name: 'Trip', memberIds: ['alice', 'bob'] },
        'alice',
      );

      expect(result).toHaveProperty('id', 'g1');
      expect(groupsRepository.save).toHaveBeenCalled();
    });

    it('rejects creating a group with a non-friend', async () => {
      usersService.findOne.mockImplementation((id: string) => {
        return Promise.resolve({ alice, bob, charlie }[id] || null);
      });
      // Alice is only friends with Bob — Charlie is not in her friends list.
      usersService.getFriendsList.mockResolvedValue([bob]);

      await expect(
        service.create(
          { name: 'Trip', memberIds: ['alice', 'bob', 'charlie'] },
          'alice',
        ),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create(
          { name: 'Trip', memberIds: ['alice', 'bob', 'charlie'] },
          'alice',
        ),
      ).rejects.toThrow(/is not in your friends list/);
    });
  });

  describe('mutation auth (assertCallerIsMember)', () => {
    it('throws NotFoundException for update when the group does not exist', async () => {
      groupsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('missing', { name: 'x' }, 'alice'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when a non-member tries to update', async () => {
      groupsRepository.findOne.mockResolvedValue({
        id: 'g1',
        name: 'Trip',
        members: [alice, bob],
      });

      await expect(
        service.update('g1', { name: 'hijacked' }, 'charlie'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when a non-member tries to delete', async () => {
      groupsRepository.findOne.mockResolvedValue({
        id: 'g1',
        members: [alice, bob],
      });

      await expect(service.remove('g1', 'charlie')).rejects.toThrow(
        ForbiddenException,
      );
      expect(groupsRepository.softDelete).not.toHaveBeenCalled();
    });
  });

  describe('remove - soft delete', () => {
    it('calls softDelete (not hard delete) when the caller is a member', async () => {
      groupsRepository.findOne.mockResolvedValue({
        id: 'g1',
        members: [alice, bob],
      });

      await service.remove('g1', 'alice');

      expect(groupsRepository.softDelete).toHaveBeenCalledWith('g1');
    });
  });
});
