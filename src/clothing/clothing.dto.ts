import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateClothingDto {
  @IsString()
  @IsNotEmpty()
  public name: string;

  public image: Express.Multer.File;

  @IsString()
  @IsNotEmpty()
  public category: string;

  @IsString()
  @IsNotEmpty()
  public material: string;

  @IsString()
  @IsNotEmpty()
  public description: string;
}

export class UpdateClothingDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  public name: string;

  public image: Express.Multer.File;

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
  public description: string;
}
