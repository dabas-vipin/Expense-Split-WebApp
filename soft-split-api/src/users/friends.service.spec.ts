import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { FriendsService } from './friends.service';
import { User } from './entities/user.entity';
import { FriendRequest } from './entities/friend-request.entity';

describe('FriendsService', () => {
  let service: FriendsService;
  let usersRepository: any;
  let friendRequestRepository: any;

  const alice = { id: 'alice', email: 'a@x.com', isActive: true };
  const bob = { id: 'bob', email: 'b@x.com', isActive: true };

  // Repository.findOne dispatches by where-clause key — sender lookups go by
  // id, receiver lookups go by email. Returning the right mock per call keeps
  // the assertions stable across the two service.method() invocations a
  // single test (`expect(...).rejects.toThrow(A); expect(...).rejects.toThrow(/msg/);`)
  // typically makes.
  const lookupBy = (opts: any) => {
    const where = opts?.where ?? {};
    for (const candidate of [alice, bob]) {
      if (where.id === candidate.id) return Promise.resolve(candidate);
      if (where.email === candidate.email) return Promise.resolve(candidate);
    }
    return Promise.resolve(null);
  };

  beforeEach(async () => {
    usersRepository = { findOne: jest.fn(lookupBy) };
    friendRequestRepository = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((data) => data),
      save: jest.fn((data) =>
        Promise.resolve({ id: 'req1', status: 'pending', ...data }),
      ),
    };
    const dataSource = { transaction: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FriendsService,
        { provide: getRepositoryToken(User), useValue: usersRepository },
        {
          provide: getRepositoryToken(FriendRequest),
          useValue: friendRequestRepository,
        },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<FriendsService>(FriendsService);
  });

  it('rejects sending a friend request to yourself', async () => {
    await expect(
      service.sendFriendRequest('alice', 'a@x.com'),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.sendFriendRequest('alice', 'a@x.com'),
    ).rejects.toThrow(/yourself/);
  });

  it('rejects sending a duplicate pending request', async () => {
    friendRequestRepository.findOne.mockResolvedValue({
      id: 'existing-req',
      status: 'pending',
    });

    await expect(
      service.sendFriendRequest('alice', 'b@x.com'),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.sendFriendRequest('alice', 'b@x.com'),
    ).rejects.toThrow(/already exists/);
  });

  it('rejects sending when the receiver does not exist', async () => {
    await expect(
      service.sendFriendRequest('alice', 'nobody@x.com'),
    ).rejects.toThrow(NotFoundException);
  });

  it('persists a new pending request when sender, receiver, and friendship invariants hold', async () => {
    const result = await service.sendFriendRequest('alice', 'b@x.com');

    expect(friendRequestRepository.save).toHaveBeenCalled();
    expect(result).toMatchObject({ id: 'req1', status: 'pending' });
  });
});
