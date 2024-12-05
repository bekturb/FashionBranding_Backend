import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class LogInDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @Length(8, 50)
  password?: string;
}