import { IsOptional, IsString, IsNumber, IsDateString, IsArray, IsObject, IsIn } from 'class-validator';

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
} 