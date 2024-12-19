import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBannerDto {
  @IsString()
  @IsNotEmpty()
  public title: string;

  @IsString()
  @IsNotEmpty()
  public description: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  public image: string;

  @IsString()
  @IsNotEmpty()
  public btnColor: string;

  @IsString()
  @IsNotEmpty()
  public btnText: string;
}

export class UpdateBannerDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  public title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  public description?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  public image?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  public btnColor?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  public btnText?: string;
}
