import { IsString, IsOptional, IsBoolean, IsEnum, IsUUID, IsUrl, MinLength, MaxLength } from 'class-validator';
import { PostStatus } from 'generated/prisma/enums';
export class CreatePostDto {
  @IsString()
  @MinLength(5, { message: 'Title is too short' })
  @MaxLength(150, { message: 'Title is too long' })
  title: string;

  // Optional: If not provided, backend should generate it from the title
  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  @MaxLength(300, { message: 'Excerpt should be short (under 300 chars)' })
  excerpt?: string;

  @IsString()
  @MinLength(20, { message: 'Content is too short' })
  content: string; // This will likely hold HTML strings

  @IsUrl({require_tld: false }, { message: 'Cover Image must be a valid URL' })
  @IsOptional()
  coverImage?: string;

  @IsUUID('4', { message: 'Invalid Category ID' })
  categoryId: string;

  @IsEnum(PostStatus)
  @IsOptional()
  status?: PostStatus; // Defaults to DRAFT in logic if missing

  @IsBoolean()
  @IsOptional()
  isTrending?: boolean;
}