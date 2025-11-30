import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @MinLength(3, { message: 'Category name must be at least 3 characters long' })
  @MaxLength(50, { message: 'Category name is too long' })
  name: string;

  @IsString()
  @IsOptional()
  slug?: string; // Optional: Backend will generate if not provided

  @IsString()
  @IsOptional()
  @MaxLength(200, { message: 'Description is too long (max 200 chars)' })
  description?: string;
}