import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SettlementsService } from './settlements.service';
import { Settlement } from './entities/settlement.entity';
import { UsersService } from '../users/users.service';
import { ActivityService } from '../activity/activity.service';

describe('SettlementsService', () => {
  let service: SettlementsService;
  let settlementsRepo: any;
  let usersService: any;
  let activityService: any;

  const alice = { id: 'alice', name: 'Alice', isActive: true };
  const bob = { id: 'bob', name: 'Bob', isActive: true };
  const inactive = { id: 'inactive', name: 'Gone', isActive: false };

  beforeEach(async () => {
    settlementsRepo = {
      create: jest.fn((data) => data),
      save: jest.fn((data) =>
        Promise.resolve({ id: 's1', createdAt: new Date(), ...data }),
      ),
    };
    usersService = {
      findOne: jest.fn((id: string) =>
        Promise.resolve({ alice, bob, inactive }[id] ?? null),
      ),
    };
    activityService = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettlementsService,
        { provide: getRepositoryToken(Settlement), useValue: settlementsRepo },
        { provide: UsersService, useValue: usersService },
        { provide: ActivityService, useValue: activityService },
      ],
    }).compile();

    service = module.get<SettlementsService>(SettlementsService);
  });

  it('creates a settlement and emits a matching activity event', async () => {
    const result = await service.create('alice', {
      payeeId: 'bob',
      amount: 25.5,
      note: 'lunch',
    });

    expect(result).toMatchObject({ id: 's1' });
    expect(settlementsRepo.save).toHaveBeenCalled();
    const saved = settlementsRepo.save.mock.calls[0][0];
    // decimal column is stored as a fixed-2 string for precision.
    expect(saved.amount).toBe('25.50');
    expect(saved.payer.id).toBe('alice');
    expect(saved.payee.id).toBe('bob');

    expect(activityService.log).toHaveBeenCalledTimes(1);
    const event = activityService.log.mock.calls[0][0];
    expect(event.type).toBe('settlement');
    expect(event.actor.id).toBe('alice');
    expect(event.recipient.id).toBe('bob');
    expect(event.payload).toMatchObject({
      settlementId: 's1',
      amount: 25.5,
      note: 'lunch',
    });
  });

  it('rejects settling with yourself', async () => {
    await expect(
      service.create('alice', { payeeId: 'alice', amount: 10 }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.create('alice', { payeeId: 'alice', amount: 10 }),
    ).rejects.toThrow(/yourself/);
  });

  it('rejects when the payee does not exist', async () => {
    await expect(
      service.create('alice', { payeeId: 'nobody', amount: 10 }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects when the payee is deactivated', async () => {
    await expect(
      service.create('alice', { payeeId: 'inactive', amount: 10 }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.create('alice', { payeeId: 'inactive', amount: 10 }),
    ).rejects.toThrow(/not active/);
  });

  it('still returns the settlement when activity logging fails', async () => {
    activityService.log.mockRejectedValue(new Error('logging blew up'));

    const result = await service.create('alice', {
      payeeId: 'bob',
      amount: 10,
    });

    expect(result).toMatchObject({ id: 's1' });
  });
});
