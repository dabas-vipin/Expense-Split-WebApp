import { Test, TestingModule } from '@nestjs/testing';
import { ExpensesService } from './expenses.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Expense } from './entities/expense.entity';
import { UsersService } from '../users/users.service';
import { GroupsService } from '../groups/groups.service';
import { DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';

describe('ExpensesService - Input Validation', () => {
  let service: ExpensesService;
  let dataSource: DataSource;

  const mockUsersService = {
    findOne: jest.fn().mockResolvedValue({ id: '1', name: 'Test User' }),
  };

  const mockGroupsService = {
    findOne: jest.fn().mockResolvedValue({ id: '1', members: [{ id: '1' }] }),
  };

  const mockDataSource = {
    transaction: jest.fn((cb) => cb({
      create: jest.fn().mockReturnValue({}),
      save: jest.fn().mockResolvedValue({}),
      findOne: jest.fn().mockResolvedValue({
        id: '1',
        amount: 100,
        splitType: 'equal',
        splitDetails: null,
      }),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpensesService,
        {
          provide: getRepositoryToken(Expense),
          useValue: {},
        },
        { provide: UsersService, useValue: mockUsersService },
        { provide: GroupsService, useValue: mockGroupsService },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<ExpensesService>(ExpensesService);
    dataSource = module.get<DataSource>(DataSource);
  });

  describe('create - validation', () => {
    it('should pass percentage validation when sum is 100', async () => {
      const expenseData = {
        description: 'Test',
        amount: 100,
        date: new Date().toISOString(),
        paidById: '1',
        participantIds: ['1', '2'],
        splitType: 'percentage',
        splitDetails: { '1': 60, '2': 40 },
      };

      await expect(service.create(expenseData)).resolves.not.toThrow();
    });

    it('should throw BadRequestException when percentage sum is not 100', async () => {
      const expenseData = {
        description: 'Test',
        amount: 100,
        date: new Date().toISOString(),
        paidById: '1',
        participantIds: ['1', '2'],
        splitType: 'percentage',
        splitDetails: { '1': 60, '2': 50 },
      };

      await expect(service.create(expenseData)).rejects.toThrow(BadRequestException);
      await expect(service.create(expenseData)).rejects.toThrow('Percentages must add up to 100%');
    });

    it('should pass exact validation when sum equals amount', async () => {
      const expenseData = {
        description: 'Test',
        amount: 100,
        date: new Date().toISOString(),
        paidById: '1',
        participantIds: ['1', '2'],
        splitType: 'exact',
        splitDetails: { '1': 60, '2': 40 },
      };

      await expect(service.create(expenseData)).resolves.not.toThrow();
    });

    it('should throw BadRequestException when exact sum does not equal amount', async () => {
      const expenseData = {
        description: 'Test',
        amount: 100,
        date: new Date().toISOString(),
        paidById: '1',
        participantIds: ['1', '2'],
        splitType: 'exact',
        splitDetails: { '1': 60, '2': 50 },
      };

      await expect(service.create(expenseData)).rejects.toThrow(BadRequestException);
      await expect(service.create(expenseData)).rejects.toThrow('Exact amounts must add up to the total expense amount');
    });
  });

  describe('update - validation', () => {
    it('should pass percentage validation when updating sum to 100', async () => {
      const expenseData = {
        splitType: 'percentage',
        splitDetails: { '1': 60, '2': 40 },
      };

      await expect(service.update('1', expenseData)).resolves.not.toThrow();
    });

    it('should throw BadRequestException when updating percentage sum to not 100', async () => {
      const expenseData = {
        splitType: 'percentage',
        splitDetails: { '1': 60, '2': 50 },
      };

      await expect(service.update('1', expenseData)).rejects.toThrow(BadRequestException);
      await expect(service.update('1', expenseData)).rejects.toThrow('Percentages must add up to 100%');
    });

    it('should throw BadRequestException when updating exact sum to not equal amount', async () => {
      const expenseData = {
        splitType: 'exact',
        splitDetails: { '1': 60, '2': 50 },
      };

      await expect(service.update('1', expenseData)).rejects.toThrow(BadRequestException);
      await expect(service.update('1', expenseData)).rejects.toThrow('Exact amounts must add up to the total expense amount');
    });
  });
});
