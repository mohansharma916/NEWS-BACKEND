import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  // Utility to create URL-friendly slugs
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove non-word chars
      .replace(/[\s_-]+/g, '-') // Replace spaces/underscores with -
      .replace(/^-+|-+$/g, ''); // Trim leading/trailing -
  }

  // 1. CREATE (Admin)
  async create(createCategoryDto: CreateCategoryDto) {
    // Generate slug if not provided
    const slug = createCategoryDto.slug || this.generateSlug(createCategoryDto.name);

    // Check if category already exists
    const existing = await this.prisma.category.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new ConflictException(`Category with slug "${slug}" already exists.`);
    }

    return this.prisma.category.create({
      data: {
        ...createCategoryDto,
        slug,
      },
    });
  }

  // 2. FIND ALL (Public - for Menu Bar)
  async findAll() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      // Optional: Count how many posts are in each category
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });
  }

  // 3. FIND ONE (Public - for Category Page)
  async findOne(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        posts: {
          where: { status: 'PUBLISHED' },
          orderBy: { publishedAt: 'desc' },
          take: 10, // Limit initial load to 10 posts
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category "${slug}" not found`);
    }

    return category;
  }

  // 4. UPDATE (Admin)
  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    // Check if category exists first
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Category not found');

    // If updating name, optionally update slug (be careful with SEO!)
    // For now, let's keep logic simple: update fields as passed
    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  // 5. REMOVE (Admin)
  async remove(id: string) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Category not found');

    return this.prisma.category.delete({
      where: { id },
    });
  }
}