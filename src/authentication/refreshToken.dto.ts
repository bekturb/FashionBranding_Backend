import { IsBoolean, IsNotEmpty, IsString } from "class-validator";

export class RefreshAccessTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;

  @IsBoolean()
  @IsNotEmpty()
  rememberMe: boolean;
}
