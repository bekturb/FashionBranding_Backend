import { IsNotEmpty, IsOptional, IsPhoneNumber, IsString } from 'class-validator';

export class CreateApplicationRequestDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  size: string;

  @IsString()
  @IsNotEmpty()
  textileName: string;

  @IsString()
  @IsPhoneNumber()
  @IsNotEmpty()
  phoneNumber: string;
}

export class UpdateApplicationRequestDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  size: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  textileName: string;

  @IsString()
  @IsPhoneNumber()
  @IsNotEmpty()
  @IsOptional()
  phoneNumber: string;
}
