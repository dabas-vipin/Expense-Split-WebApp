// src/expenses/dto/create-expense.dto.ts
import { IsNotEmpty, IsNumber, IsDateString, IsArray, IsOptional, IsString, IsObject, IsIn, MaxLength, Length } from 'class-validator';

export const EXPENSE_CATEGORIES = [
  'food',
  'transport',
  'lodging',
  'entertainment',
  'utilities',
  'shopping',
  'other',
] as const;
export type ExpenseCategoryInput = (typeof EXPENSE_CATEGORIES)[number];

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

  // Phase 3 richness — all optional with sane defaults at the DB layer.
  @IsOptional()
  @IsIn(EXPENSE_CATEGORIES)
  category?: ExpenseCategoryInput;

  // ISO-4217 currency code. Validated as length 3 and uppercased by the
  // service; we don't ship an exhaustive code list to keep the validator
  // permissive for less-common currencies.
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}