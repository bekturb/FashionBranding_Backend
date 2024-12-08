import { IsOptional, IsString, Length } from "class-validator";

export class ResetForgotenPasswordDto {
  @IsString()
  verificationCode: string;

  @IsOptional()
  @IsString()
  @Length(8, 50)
  password?: string;
}
