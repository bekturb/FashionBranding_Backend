import { IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator';

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

  @IsString()
  @IsNotEmpty()
  image: string;
}
