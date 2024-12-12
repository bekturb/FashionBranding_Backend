import { IsEnum, IsNotEmpty, IsString } from "class-validator";

export class NotificationsDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(Request)
  @IsNotEmpty()
  type: Request;
}
