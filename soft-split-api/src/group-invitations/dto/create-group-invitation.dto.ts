import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateGroupInvitationDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
