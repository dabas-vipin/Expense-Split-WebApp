// src/expenses/expenses.controller.ts
import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Request, ForbiddenException, Query, BadRequestException, NotFoundException } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { Expense } from './entities/expense.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { Req } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';

interface RequestWithUser extends ExpressRequest {
  user: {
    id: string;
    isAdmin?: boolean;
  };
}

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) { }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Request() req): Promise<Expense[]> {
    if (!req.user.isAdmin) {
      throw new ForbiddenException('Only administrators can access all expenses');
    }
    return this.expensesService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('user')
  async findByUser(
    @Request() req,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('groupId') groupId?: string
  ): Promise<{ data: Expense[]; total: number; page: number; limit: number }> {
    return this.expensesService.findByUserPaginated(req.user.id, { page, limit, groupId });
  }

  @Get('balances')
  @UseGuards(JwtAuthGuard)
  async getBalances(
    @Req() req: RequestWithUser,
    @Query('groupId') groupId?: string
  ) {
    const userId = req.user.id;
    return this.expensesService.getBalances(userId, groupId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req): Promise<Expense> {
    const expense = await this.expensesService.findOne(id);
    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    const hasAccess = await this.expensesService.checkExpenseAccess(req.user.id, expense);
    if (!hasAccess && !req.user.isAdmin) {
      throw new ForbiddenException('You do not have access to this expense');
    }

    return expense;
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() expenseData: CreateExpenseDto, @Request() req): Promise<Expense> {
    if (expenseData.paidById !== req.user.id && !req.user.isAdmin) {
      throw new ForbiddenException('You can only create expenses paid by yourself');
    }

    if (expenseData.groupId) {
      const hasAccess = await this.expensesService.checkGroupAccess(req.user.id, expenseData.groupId);
      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this group');
      }
    }

    return this.expensesService.create(expenseData);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() expenseData: UpdateExpenseDto,
    @Request() req
  ): Promise<Expense> {
    const expense = await this.expensesService.findOne(id);
    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    if (expense.paidBy.id !== req.user.id && !req.user.isAdmin) {
      throw new ForbiddenException('You can only update expenses you paid for');
    }

    return this.expensesService.update(id, expenseData);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req): Promise<void> {
    const expense = await this.expensesService.findOne(id);
    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    if (expense.paidBy.id !== req.user.id && !req.user.isAdmin) {
      throw new ForbiddenException('You can only delete expenses you paid for');
    }

    return this.expensesService.remove(id);
  }
}