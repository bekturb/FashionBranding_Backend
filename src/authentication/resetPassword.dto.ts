import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @Length(8, 50)
  oldPassword?: string;

  @IsOptional()
  @IsString()
  @Length(8, 50)
  password?: string;

  @IsOptional()
  @IsString()
  @Length(8, 50)
  confirmPassword?: string;
}