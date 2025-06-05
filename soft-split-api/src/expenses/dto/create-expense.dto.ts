// src/expenses/dto/create-expense.dto.ts
import { IsNotEmpty, IsNumber, IsDateString, IsArray, IsOptional, IsString, IsObject } from 'class-validator';

export class CreateExpenseDto {
  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsNotEmpty()
  @IsString()
  paidById: string;

  @IsArray()
  @IsNotEmpty()
  participantIds: string[];

  @IsOptional()
  @IsString()
  groupId?: string;

  @IsNotEmpty()
  @IsString()
  splitType: string;

  @IsOptional()
  @IsObject()
  splitDetails?: Record<string, number>;
}