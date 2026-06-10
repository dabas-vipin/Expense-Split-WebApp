// src/expenses/expenses.service.ts
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Not, IsNull, In } from 'typeorm';
import { Expense } from './entities/expense.entity';
import { UsersService } from '../users/users.service';
import { GroupsService } from '../groups/groups.service';
import { SettlementsService } from '../settlements/settlements.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { greedyMinCashFlow } from './balance-simplification';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private expensesRepository: Repository<Expense>,
    private usersService: UsersService,
    private groupsService: GroupsService,
    private settlementsService: SettlementsService,
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
      // Validate split details
      if (expenseData.splitType === 'percentage' && expenseData.splitDetails) {
        const totalPercentage = Object.values(expenseData.splitDetails).reduce((sum, val) => sum + val, 0);
        // Allow for small floating point inaccuracies
        if (Math.abs(totalPercentage - 100) > 0.01) {
          throw new BadRequestException('Percentages must add up to 100%');
        }
      } else if (expenseData.splitType === 'exact' && expenseData.splitDetails) {
        const totalExact = Object.values(expenseData.splitDetails).reduce((sum, val) => sum + val, 0);
        if (Math.abs(totalExact - expenseData.amount) > 0.01) {
          throw new BadRequestException('Exact amounts must add up to the total expense amount');
        }
      }

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

      const splitTypeToValidate = expenseData.splitType || expense.splitType;
      const splitDetailsToValidate = expenseData.splitDetails || expense.splitDetails;
      const amountToValidate = expenseData.amount || expense.amount;

      // Validate split details
      if (splitTypeToValidate === 'percentage' && splitDetailsToValidate) {
        const totalPercentage = Object.values(splitDetailsToValidate).reduce((sum, val) => sum + val, 0);
        if (Math.abs(totalPercentage - 100) > 0.01) {
          throw new BadRequestException('Percentages must add up to 100%');
        }
      } else if (splitTypeToValidate === 'exact' && splitDetailsToValidate) {
        const totalExact = Object.values(splitDetailsToValidate).reduce((sum, val) => sum + val, 0);
        if (Math.abs(totalExact - amountToValidate) > 0.01) {
          throw new BadRequestException('Exact amounts must add up to the total expense amount');
        }
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
    await this.expensesRepository.softDelete(id);
  }

  async getBalances(userId: string, groupId?: string): Promise<any> {
    // Step 1: collect IDs of expenses involving this user. A direct
    // leftJoinAndSelect with `WHERE participants.id = :userId` filters the
    // joined participants array to only the matching participant — which made
    // splitAmount = amount / 1 instead of amount / N. Splitting the lookup
    // into "find ids" then "load full rows" sidesteps that.
    const idQuery = this.expensesRepository
      .createQueryBuilder('expense')
      .leftJoin('expense.paidBy', 'paidBy')
      .leftJoin('expense.participants', 'participants')
      .where('(paidBy.id = :userId OR participants.id = :userId)', { userId })
      .andWhere('expense.amount IS NOT NULL')
      .andWhere('paidBy.isActive = true')
      .select('DISTINCT expense.id', 'id');

    if (groupId) {
      idQuery
        .leftJoin('expense.group', 'group')
        .andWhere('group.id = :groupId', { groupId });
    }

    const idRows = await idQuery.getRawMany<{ id: string }>();
    const ids = idRows.map((row) => row.id);
    const expenses = ids.length
      ? await this.expensesRepository.find({
          where: { id: In(ids) },
          relations: ['paidBy', 'participants', 'group'],
        })
      : [];

    const balances: Record<string, Record<string, number>> = {};

    for (const expense of expenses || []) {
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

    // Apply settlements only against the cross-group view. Per-group balances
    // intentionally don't include them because settlements aren't group-scoped.
    if (!groupId) {
      const settlements =
        await this.settlementsService.findInvolvingUser(userId);
      for (const settlement of settlements) {
        const payerId = settlement.payer.id;
        const payeeId = settlement.payee.id;
        const amount = parseFloat(settlement.amount.toString());
        if (!amount) continue;
        if (!balances[payerId]) balances[payerId] = {};
        if (!balances[payeeId]) balances[payeeId] = {};
        // Same direction as an expense: the payer becomes more of a creditor
        // by the settled amount (their existing debt to payee shrinks).
        this.updateBalance(balances, payerId, payeeId, amount);
      }
    }

    if (!balances[userId] || Object.keys(balances[userId]).length === 0) {
      return [];
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

  /**
   * Returns the minimum set of payments that fully settles every member's
   * net position within `groupId`. Pure-expense based — settlements are
   * cross-group, so they intentionally do NOT factor in here (see
   * getBalances() for the same rule applied to the cross-group view).
   *
   * Caller must be a member of the group (404 if missing, 403 if not).
   */
  async getSimplifiedGroupBalances(groupId: string, callerId: string) {
    const group = await this.groupsService.findOne(groupId);
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    if (!group.members.some((member) => member.id === callerId)) {
      throw new ForbiddenException('You are not a member of this group');
    }

    // Reuse the same id-then-load pattern as getBalances so participants
    // arrays aren't filtered down by the join.
    const idRows = await this.expensesRepository
      .createQueryBuilder('expense')
      .leftJoin('expense.group', 'group')
      .leftJoin('expense.paidBy', 'paidBy')
      .where('group.id = :groupId', { groupId })
      .andWhere('expense.amount IS NOT NULL')
      .andWhere('paidBy.isActive = true')
      .select('DISTINCT expense.id', 'id')
      .getRawMany<{ id: string }>();

    const expenses = idRows.length
      ? await this.expensesRepository.find({
          where: { id: In(idRows.map((row) => row.id)) },
          relations: ['paidBy', 'participants'],
        })
      : [];

    // Work in cents to avoid float drift across many splits.
    const netCents = new Map<string, number>();
    const bump = (id: string, delta: number) => {
      netCents.set(id, (netCents.get(id) ?? 0) + delta);
    };

    for (const expense of expenses) {
      if (!expense.amount || !expense.paidBy || !expense.participants?.length) {
        continue;
      }
      const totalCents = Math.round(
        parseFloat(expense.amount.toString()) * 100,
      );
      const participants = expense.participants;
      bump(expense.paidBy.id, totalCents);

      switch (expense.splitType) {
        case 'equal': {
          // Distribute integer cents evenly; any remainder cent goes to the
          // first participants in order so the totals sum exactly to `totalCents`.
          const base = Math.floor(totalCents / participants.length);
          let remainder = totalCents - base * participants.length;
          for (const participant of participants) {
            const share = base + (remainder > 0 ? 1 : 0);
            if (remainder > 0) remainder -= 1;
            bump(participant.id, -share);
          }
          break;
        }
        case 'percentage':
          for (const participant of participants) {
            const pct = expense.splitDetails?.[participant.id] || 0;
            bump(participant.id, -Math.round((pct / 100) * totalCents));
          }
          break;
        case 'exact':
          for (const participant of participants) {
            const exact = expense.splitDetails?.[participant.id] || 0;
            bump(participant.id, -Math.round(exact * 100));
          }
          break;
      }
    }

    const transactions = greedyMinCashFlow(netCents);
    if (transactions.length === 0) return [];

    // Resolve names from the group's already-loaded member list (saves a
    // round-trip per user).
    const nameById = new Map(group.members.map((m) => [m.id, m.name]));

    return transactions.map((tx) => ({
      from: tx.from,
      fromName: nameById.get(tx.from) ?? '?',
      to: tx.to,
      toName: nameById.get(tx.to) ?? '?',
      amount: tx.cents / 100,
    }));
  }
}