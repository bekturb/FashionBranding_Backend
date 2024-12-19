import { IsEmail, IsISO8601, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class verificationCodetDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsISO8601()
  @IsNotEmpty()
  expiresAt: string;

  @IsISO8601()
  @IsNotEmpty()
  createdAt: string;
}

export class otpCodetDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNumber()
  @IsNotEmpty()
  otp: string;

  @IsISO8601()
  @IsNotEmpty()
  expiresAt: string;

  @IsISO8601()
  @IsNotEmpty()
  createdAt: string;
}