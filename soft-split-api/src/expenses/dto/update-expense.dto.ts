import { IsOptional, IsString, IsNumber, IsDateString, IsArray, IsObject, IsIn, Length, MaxLength } from 'class-validator';
import { EXPENSE_CATEGORIES, ExpenseCategoryInput } from './create-expense.dto';

export class UpdateExpenseDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsArray()
  participantIds?: string[];

  @IsOptional()
  @IsString()
  @IsIn(['equal', 'percentage', 'exact'])
  splitType?: string;

  @IsOptional()
  @IsObject()
  splitDetails?: Record<string, number>;

  @IsOptional()
  @IsIn(EXPENSE_CATEGORIES)
  category?: ExpenseCategoryInput;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null;
} 