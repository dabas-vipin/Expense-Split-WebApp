// src/expenses/expenses.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Not, IsNull } from 'typeorm';
import { Expense } from './entities/expense.entity';
import { UsersService } from '../users/users.service';
import { GroupsService } from '../groups/groups.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private expensesRepository: Repository<Expense>,
    private usersService: UsersService,
    private groupsService: GroupsService,
    private dataSource: DataSource
  ) {}

  async findAll(): Promise<Expense[]> {
    return this.expensesRepository.find({
      relations: ['paidBy', 'participants', 'group'],
    });
  }

  async findOne(id: string): Promise<Expense> {
    return this.expensesRepository.findOne({
      where: { id },
      relations: ['paidBy', 'participants', 'group'],
    });
  }

  async findByUser(userId: string): Promise<Expense[]> {
    return this.expensesRepository
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.paidBy', 'paidBy')
      .leftJoinAndSelect('expense.participants', 'participants')
      .leftJoinAndSelect('expense.group', 'group')
      .where('paidBy.id = :userId', { userId })
      .orWhere('participants.id = :userId', { userId })
      .getMany();
  }

  async findByUserPaginated(userId: string, options: { page: number; limit: number; groupId?: string }) {
    const query = this.expensesRepository
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.paidBy', 'paidBy')
      .leftJoinAndSelect('expense.participants', 'participants')
      .leftJoinAndSelect('expense.group', 'group')
      .where('(paidBy.id = :userId OR participants.id = :userId)', { userId })
      .orderBy('expense.date', 'DESC');

    if (options.groupId) {
      query.andWhere('group.id = :groupId', { groupId: options.groupId });
    }

    const [data, total] = await query
      .skip((options.page - 1) * options.limit)
      .take(options.limit)
      .getManyAndCount();

    return {
      data,
      total,
      page: options.page,
      limit: options.limit
    };
  }

  async create(expenseData: CreateExpenseDto): Promise<Expense> {
    return this.dataSource.transaction(async manager => {
      // If group is specified, validate that all participants are group members
      if (expenseData.groupId) {
        const group = await this.groupsService.findOne(expenseData.groupId);
        if (!group) {
          throw new NotFoundException('Group not found');
        }

        // Check if all participants are group members
        const groupMemberIds = group.members.map(member => member.id);
        const invalidParticipants = expenseData.participantIds.filter(
          id => !groupMemberIds.includes(id)
        );

        if (invalidParticipants.length > 0) {
          const invalidUserNames = await Promise.all(
            invalidParticipants.map(id => 
              this.usersService.findOne(id).then(user => user.name)
            )
          );
          throw new BadRequestException({
            message: 'Selected participants are not part of the group',
            invalidParticipants: invalidUserNames
          });
        }

        // Ensure the payer is a group member
        if (!groupMemberIds.includes(expenseData.paidById)) {
          const payer = await this.usersService.findOne(expenseData.paidById);
          throw new BadRequestException({
            message: 'The payer must be a member of the group',
            invalidPayer: payer.name
          });
        }
      }

      const expense = manager.create(Expense, {
        description: expenseData.description,
        amount: expenseData.amount,
        date: expenseData.date,
        splitType: expenseData.splitType,
        splitDetails: expenseData.splitDetails
      });

      expense.paidBy = await this.usersService.findOne(expenseData.paidById);
      expense.participants = await Promise.all(
        expenseData.participantIds.map(id => this.usersService.findOne(id))
      );

      if (expenseData.groupId) {
        expense.group = await this.groupsService.findOne(expenseData.groupId);
      }

      return manager.save(Expense, expense);
    });
  }

  async update(id: string, expenseData: UpdateExpenseDto): Promise<Expense> {
    return this.dataSource.transaction(async manager => {
      const expense = await manager.findOne(Expense, {
        where: { id },
        relations: ['participants', 'paidBy', 'group']
      });

      if (!expense) {
        throw new NotFoundException('Expense not found');
      }

      // Update simple fields
      if (expenseData.description) expense.description = expenseData.description;
      if (expenseData.amount) expense.amount = expenseData.amount;
      if (expenseData.date) expense.date = new Date(expenseData.date);
      if (expenseData.splitType) expense.splitType = expenseData.splitType;
      if (expenseData.splitDetails) expense.splitDetails = expenseData.splitDetails;

      // Update participants if provided
      if (expenseData.participantIds) {
        const participants = await Promise.all(
          expenseData.participantIds.map(userId => 
            this.usersService.findOne(userId)
          )
        );
        expense.participants = participants;
      }

      return manager.save(Expense, expense);
    });
  }

  async remove(id: string): Promise<void> {
    await this.expensesRepository.delete(id);
  }

  async getBalances(userId: string, groupId?: string): Promise<any> {
    const query = this.expensesRepository
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.paidBy', 'paidBy')
      .leftJoinAndSelect('expense.participants', 'participants')
      .leftJoinAndSelect('expense.group', 'group')
      .where('(paidBy.id = :userId OR participants.id = :userId)', { userId })
      .andWhere('expense.amount IS NOT NULL')
      .andWhere('paidBy.isActive = true');

    if (groupId) {
      query.andWhere('group.id = :groupId', { groupId });
    }

    const expenses = await query.getMany();

    // Return empty array if no expenses
    if (!expenses || expenses.length === 0) {
      return [];
    }

    const balances = {};

    for (const expense of expenses) {
      if (!expense.amount || !expense.paidBy || !expense.participants.length) {
        continue; // Skip invalid expenses
      }

      const paidById = expense.paidBy.id;
      const amount = parseFloat(expense.amount.toString());
      const participants = expense.participants;
      
      // Initialize balances for payer if not exists
      if (!balances[paidById]) {
        balances[paidById] = {};
      }
      
      switch (expense.splitType) {
        case 'equal':
          const splitAmount = amount / participants.length;
          for (const participant of participants) {
            if (participant.id === paidById) continue;
            this.updateBalance(balances, paidById, participant.id, splitAmount);
          }
          break;

        case 'percentage':
          for (const participant of participants) {
            if (participant.id === paidById) continue;
            const percentage = expense.splitDetails?.[participant.id] || 0;
            const splitAmount = (percentage / 100) * amount;
            this.updateBalance(balances, paidById, participant.id, splitAmount);
          }
          break;

        case 'exact':
          for (const participant of participants) {
            if (participant.id === paidById) continue;
            const splitAmount = expense.splitDetails?.[participant.id] || 0;
            this.updateBalance(balances, paidById, participant.id, splitAmount);
          }
          break;
      }
    }

    return await this.simplifyBalances(balances, userId);
  }

  private updateBalance(balances: any, payerId: string, participantId: string, amount: number) {
    if (!balances[payerId][participantId]) {
      balances[payerId][participantId] = 0;
    }
    balances[payerId][participantId] += amount;

    if (!balances[participantId]) {
      balances[participantId] = {};
    }
    if (!balances[participantId][payerId]) {
      balances[participantId][payerId] = 0;
    }
    balances[participantId][payerId] -= amount;
  }

  private async simplifyBalances(balances: any, userId: string): Promise<any> {
    const simplified = [];
    
    // Only process balances where the user is either the payer or participant
    for (const otherUserId in balances[userId]) {
      if (parseFloat(balances[userId][otherUserId].toFixed(2)) !== 0) {
        const otherUser = await this.usersService.findOne(otherUserId);
        
        simplified.push({
          from: userId,
          fromName: (await this.usersService.findOne(userId)).name,
          to: otherUserId,
          toName: otherUser.name,
          amount: parseFloat(balances[userId][otherUserId].toFixed(2)),
        });
      }
    }
    
    return simplified;
  }

  async checkExpenseAccess(userId: string, expense: Expense): Promise<boolean> {
    return expense.paidBy.id === userId || 
           expense.participants.some(p => p.id === userId);
  }

  async checkGroupAccess(userId: string, groupId: string): Promise<boolean> {
    const group = await this.groupsService.findOne(groupId);
    return group.members.some(member => member.id === userId);
  }

  async getUserExpenses(userId: string, options: { page: number; limit: number; groupId?: string; search?: string }) {
    const queryBuilder = this.expensesRepository
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.paidBy', 'paidBy')
      .leftJoinAndSelect('expense.participants', 'participants')
      .leftJoinAndSelect('expense.group', 'group')
      .where('(paidBy.id = :userId OR participants.id = :userId)', { userId })
      .orderBy('expense.date', 'DESC');

    if (options.groupId) {
      queryBuilder.andWhere('group.id = :groupId', { groupId: options.groupId });
    }

    if (options.search) {
      queryBuilder.andWhere('expense.description ILIKE :search', { search: `%${options.search}%` });
    }

    const [items, total] = await queryBuilder
      .skip((options.page - 1) * options.limit)
      .take(options.limit)
      .getManyAndCount();

    return {
      items,
      meta: {
        total,
        page: options.page,
        limit: options.limit,
        totalPages: Math.ceil(total / options.limit)
      }
    };
  }

  async getExpenseWithParticipants(expenseId: string) {
    return this.expensesRepository.findOne({
      where: { id: expenseId },
      relations: ['participants', 'paidBy'],
      withDeleted: true // Include soft-deleted users
    });
  }
}