import { IsBoolean, IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class LogInDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsBoolean()
  public rememberMe: boolean;
}