import { IsString, IsEmail, IsOptional, Length, IsEnum } from 'class-validator';

enum UserRole {
    Admin = 'admin',
    User = 'user',
  }

export class UserDto {
  @IsString()
  @Length(3, 20)
  username: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @Length(8, 50)
  password?: string;

  @IsEnum(UserRole)
  role: UserRole;
}