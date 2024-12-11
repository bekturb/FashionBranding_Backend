import {IsNotEmpty, IsString, IsEnum, IsPhoneNumber } from 'class-validator';
import Request from './enum/request.enum';

export class CreateRequestDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsPhoneNumber()
  @IsNotEmpty()
  phoneNumber: string;

  @IsEnum(Request)
  @IsNotEmpty()
  type: Request;
}