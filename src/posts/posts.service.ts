import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'generated/prisma/client';
import * as geoip from 'geoip-lite';

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
    
    const existingPost = await this.prisma.post.findUnique({ where: { slug } });
    if (existingPost) {
      throw new BadRequestException('Slug already exists. Please change the title slightly.');
    }
    // START SCHEDULING LOGIC
    let publishedAt = createPostDto.publishedAt ? new Date(createPostDto.publishedAt) : null;

    // If status is explicitly PUBLISHED but no future date is provided, set publishedAt to now.
    // If a date is provided, it's used (for scheduling, even if future).
    if (createPostDto.status === 'PUBLISHED' && !publishedAt) {
      publishedAt = new Date();
    }
    return this.prisma.post.create({
      data: {
        ...createPostDto,
        publishedAt,
        slug,
        authorId, // Force the relationship
      },
    });
  }

// src/posts/posts.service.ts

  // Update this method signature
  async findAllPublished(page: number = 1, limit: number = 10, categorySlug?: string) {
    const skip = (page - 1) * limit;

    console.log("Finding published posts:", { page, limit, categorySlug });



    // Build the query filter
    const whereClause = {
      status: 'PUBLISHED',
      publishedAt: { lte: new Date() },
      ...(categorySlug && { category: { slug: { contains: categorySlug,
      mode: 'insensitive',} } }), // Optional filter
    };


// Run count and find in parallel
    const [posts, total] = await this.prisma.$transaction([
      this.prisma.post.findMany({
        where: whereClause as any,
        // Switch from 'include' to 'select' to exclude 'content'
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImage: true,
          publishedAt: true,
          category: { 
            select: { name: true, slug: true } 
          }, 
          author: { 
            select: { fullName: true, avatarUrl: true } 
          } 
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
      where: { status: 'PUBLISHED', publishedAt: { lte: new Date() } },
      orderBy: { views: 'desc' },
      take: 10,
      // We use 'select' to pick ONLY what the UI needs. 
      // Notice 'content' is missing.
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,     // Short summary is fine
        coverImage: true,
        publishedAt: true,
        views: true,
        category: {
          select: { name: true, slug: true }
        },
        author: {
          select: { id: true, fullName: true, avatarUrl: true }
        }
      }
    });
  }

async findOneBySlug(slug: string) {
    const post = await this.prisma.post.findUnique({
      where: { slug },
      // explicit select ensures we get the content, but ONLY public author info
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true, // <--- IMPORTANT: We explicitly keep this for the detailed view
        coverImage: true,
        publishedAt: true,
        status: true,
        updatedAt: true,
        category: { select: { name: true, slug: true } },
        author: { select: { id: true, fullName: true, avatarUrl: true } } // <--- No emails/passwords sent
      }
    });
    
    if (!post) throw new NotFoundException(`Post with slug ${slug} not found`);
    // CRITICAL: Block public access to drafts and future scheduled posts
    const isScheduled = post.publishedAt && new Date(post.publishedAt) > new Date();
    if (post.status !== 'PUBLISHED' || isScheduled) {
       throw new NotFoundException(`Post with slug ${slug} not found`);
    }
    return post;
  }


  async findByCategory(categorySlug: string) {
    return this.prisma.post.findMany({
      where: { 
        status: 'PUBLISHED',
        publishedAt: { lte: new Date() },
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
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true, // Assuming you have a status field
        views: true,
        publishedAt: true,
        updatedAt: true,
        // NO content here! Fast table loading.
        category: { select: { name: true } },
        author: { select: { fullName: true } }
      }
    });
  }

 // src/posts/posts.service.ts

  async incrementView(id: string,ip: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to midnight (e.g., 2025-11-29 00:00:00)

console.log("Incrementing view for Post ID:", id, "from IP:", ip);
    const geo = geoip.lookup(ip);
    console.log("GeoIP lookup result:", geo);
    const country = geo ? geo.country : 'Unknown';

    // Transaction ensures both happen or neither happens
    return this.prisma.$transaction([
      // A. Post Total
      this.prisma.post.update({
        where: { id },
        data: { views: { increment: 1 } },
      }),

      // B. Daily Post History
      this.prisma.dailyStat.upsert({
        where: { date_postId: { date: today, postId: id } },
        update: { views: { increment: 1 } },
        create: { date: today, postId: id, views: 1 },
      }),

      // C. Daily Geo Stats (NEW)
      this.prisma.geoStat.upsert({
        where: { date_country: { date: today, country } },
        update: { views: { increment: 1 } },
        create: { date: today, country, views: 1 },
      }),
    ]);
  }

  
  async getGeoStats(range: '24h' | '7d' | '30d' | 'all') {
    let dateFilter = {};
    const now = new Date();

    if (range === '24h') {
        // Approximate 24h as "today" for daily buckets, or strictly last 24h if you stored timestamps.
        // For daily buckets, '24h' usually means 'Today'.
        const today = new Date();
        today.setHours(0,0,0,0);
        dateFilter = { gte: today };
    } else if (range === '7d') {
        const d = new Date(); d.setDate(d.getDate() - 7); d.setHours(0,0,0,0);
        dateFilter = { gte: d };
    } else if (range === '30d') {
        const d = new Date(); d.setDate(d.getDate() - 30); d.setHours(0,0,0,0);
        dateFilter = { gte: d };
    }

    // Aggregate by Country
    const stats = await this.prisma.geoStat.groupBy({
        by: ['country'],
        where: { date: dateFilter },
        _sum: { views: true },
        orderBy: { _sum: { views: 'desc' } },
    });

    // Calculate Percentages
    const totalViews = stats.reduce((acc, curr) => acc + (curr._sum.views || 0), 0);
    
    return stats.map(s => ({
        country: s.country,
        views: s._sum.views,
        percent: totalViews > 0 ? Math.round(((s._sum.views || 0) / totalViews) * 100) : 0
    }));
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
      data: { ...updatePostDto },
    });
  }
  async remove(id: string) {
    return this.prisma.post.delete({
      where: { id },
    });
  }
}
