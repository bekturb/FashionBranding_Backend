import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateClothesDto {
  @IsString()
  @IsNotEmpty()
  public clothesName: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  public image: string;

  @IsString()
  @IsNotEmpty()
  public status: string;

  @IsString()
  @IsNotEmpty()
  public category: string;

  @IsString()
  @IsNotEmpty()
  public material: string;

  @IsString()
  @IsNotEmpty()
  public modelName: string;

  @IsString()
  @IsNotEmpty()
  public description: string;
}
