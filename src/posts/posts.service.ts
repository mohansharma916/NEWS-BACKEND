import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'generated/prisma/client';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}


  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }


 async create(createPostDto: CreatePostDto, authorId: string) {
    const slug = createPostDto.slug || this.generateSlug(createPostDto.title);
    // or the frontend can send it.



    const existingPost = await this.prisma.post.findUnique({ where: { slug } });
    if (existingPost) {
      throw new BadRequestException('Slug already exists. Please change the title slightly.');
    }
    return this.prisma.post.create({
      data: {
        ...createPostDto,
        slug,
        authorId, // Force the relationship
      },
    });
  }

// src/posts/posts.service.ts

  // Update this method signature
  async findAllPublished(page: number = 1, limit: number = 10, categorySlug?: string) {
    const skip = (page - 1) * limit;

    // Build the query filter
    const whereClause = {
      status: 'PUBLISHED',
      ...(categorySlug && { category: { slug: categorySlug } }), // Optional filter
    };

    // Run count and find in parallel
    const [posts, total] = await this.prisma.$transaction([
      this.prisma.post.findMany({
        where: whereClause as any, // Type cast if needed depending on Prisma version
        include: { 
          category: { select: { name: true, slug: true } }, 
          author: { select: { fullName: true, avatarUrl: true } } 
        },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.post.count({ where: whereClause as any }),
    ]);

    return {
      data: posts,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      }
    };
  }

async findTrending() {
    return this.prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { views: 'desc' },
      take: 5,
      include: { category: true }
    });
  }

  async findOneBySlug(slug: string) {
    const post = await this.prisma.post.findUnique({
      where: { slug },
      include: { category: true, author: true },
    });
    
    if (!post) throw new NotFoundException(`Post with slug ${slug} not found`);
    return post;
  }


  async findByCategory(categorySlug: string) {
    return this.prisma.post.findMany({
      where: { 
        status: 'PUBLISHED',
        category: { slug: categorySlug }
      },
      include: { category: true, author: true }
    });
  }

  

  async findAll() {
    return this.prisma.post.findMany();
  }

  async findOne(id: string) {
    return this.prisma.post.findUnique({
      where: { id },
      include: { category: true, author: true }, // Join data
    });
  }

  async findAllForAdmin() {
    return this.prisma.post.findMany({
      orderBy: { updatedAt: 'desc' }, // Show recently edited first
      include: { 
        author: { select: { fullName: true } },
        category: { select: { name: true } }
      }
    });
  }

 // src/posts/posts.service.ts

  async incrementView(id: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to midnight (e.g., 2025-11-29 00:00:00)

    // Transaction ensures both happen or neither happens
    return this.prisma.$transaction([
      
      // 1. Increment Total Views (for "Most Popular" sorting)
      this.prisma.post.update({
        where: { id },
        data: { views: { increment: 1 } },
      }),

      // 2. Increment "Today's" Stats (for the Trend Chart)
      this.prisma.dailyStat.upsert({
        where: {
          date_postId: {
            date: today,
            postId: id,
          },
        },
        // If row exists for today, add 1
        update: { views: { increment: 1 } },
        // If first view of the day, create row
        create: {
          date: today,
          postId: id,
          views: 1,
        },
      }),
    ]);
  }

// src/posts/posts.service.ts

  // ... existing imports
  // Make sure to import 'Category' if needed for types, but usually inferred

  // ... inside PostsService class

// src/posts/posts.service.ts

  async getAdminStats() {
    // 1. Define "Last 7 Days"
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [totalPosts, totalViewsResult, topPosts, categoryStats, dailyStats] = await Promise.all([
      this.prisma.post.count(),
      this.prisma.post.aggregate({ _sum: { views: true } }),
      this.prisma.post.findMany({
        take: 5,
        orderBy: { views: 'desc' },
        select: { id: true, title: true, views: true },
      }),
      this.prisma.category.findMany({
        include: { _count: { select: { posts: true } } },
      }),
      
      // NEW: Get actual daily history
      this.prisma.dailyStat.groupBy({
        by: ['date'],
        where: {
          date: { gte: sevenDaysAgo },
        },
        _sum: {
          views: true,
        },
        orderBy: {
          date: 'asc',
        },
      }),
    ]);

    // Format the Daily Data for Recharts
    // We map the database result to { name: "Mon", views: 120 }
    const activityTrend = dailyStats.map((stat) => ({
      name: stat.date.toLocaleDateString('en-US', { weekday: 'short' }), // "Mon", "Tue"
      views: stat._sum.views || 0,
    }));

    return {
      overview: {
        totalPosts,
        totalViews: totalViewsResult._sum.views || 0,
        avgViews: totalPosts > 0 
          ? Math.round((totalViewsResult._sum.views || 0) / totalPosts) 
          : 0,
      },
      topPosts,
      categoryData: categoryStats.map((cat) => ({
        name: cat.name,
        count: cat._count.posts,
      })),
      activityTrend, 
    };
  }



  async update(id: string, updatePostDto: UpdatePostDto) {
  
    return this.prisma.post.update({
      where: { id },
      data: updatePostDto,
    });
  }
  async remove(id: string) {
    return this.prisma.post.delete({
      where: { id },
    });
  }
}
