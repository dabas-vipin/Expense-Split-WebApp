import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  // For backwards compatibility, callers can still set the avatar to a URL
  // string directly (legacy flow). The recommended path is POST /users/me/avatar
  // with multipart/form-data, which sets this field server-side.
  @IsOptional()
  @IsString()
  avatar?: string | null;
}
