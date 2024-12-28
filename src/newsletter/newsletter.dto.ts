import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateNewsletterDto {
  @IsEmail()
  @IsNotEmpty()
  public email: string;
}