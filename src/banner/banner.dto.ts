import { ArrayMinSize, IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBannerDto {
  @IsString()
  @IsNotEmpty()
  public title: string;

  @IsString()
  @IsNotEmpty()
  public description: string;

  @IsArray()
  @ArrayMinSize(1, {message: "Требуется хотя бы одно  изображение"})
  public leftImages: Express.Multer.File[];

  @IsArray()
  @ArrayMinSize(1, {message: "Требуется хотя бы одно изображение"})
  public rightImages: Express.Multer.File[];

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
  public title: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  public description: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, {message: "Требуется хотя бы одно изображение"})
  public leftImages: Express.Multer.File[];

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, {message: "Требуется хотя бы одно изображение"})
  public rightImages: Express.Multer.File[];

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  public btnColor: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  public btnText: string;
}