import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateClothingDto {
  @IsString()
  @IsNotEmpty()
  public name: string;

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

export class UpdateClothingDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  public clothingName: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  public image: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  public status: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  public category: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  public material: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  public modelName: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  public description: string;
}
