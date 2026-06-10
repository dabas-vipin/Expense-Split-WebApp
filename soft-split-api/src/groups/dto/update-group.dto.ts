import { IsOptional, IsString, IsArray, ArrayMinSize, IsUUID } from 'class-validator';

export class UpdateGroupDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @IsUUID('all', { each: true })
  memberIds?: string[];
}
