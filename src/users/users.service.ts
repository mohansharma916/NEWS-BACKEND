import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // 1. Keep this for Login (Find by Email)
  async findOne(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  // 2. NEW: Find Author Profile by ID (For Author Page)
  async findAuthorProfile(id: string) {
    const author = await this.prisma.user.findUnique({
      where: { id },
      // SECURITY: Select only public fields! Don't send password/email.
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        bio: true,           // <--- From our new Schema
        twitterHandle: true, // <--- From our new Schema
        linkedinUrl: true,   // <--- From our new Schema
        websiteUrl: true,    // <--- From our new Schema
        posts: {
          where: { status: 'PUBLISHED' },
          orderBy: { publishedAt: 'desc' },
          take: 20, // Fetch last 20 articles
          select: {
            id: true,
            title: true,
            slug: true,
            coverImage: true,
            publishedAt: true,
            excerpt: true,
            // category: { select: { name: true, slug: true } } // Optional
          }
        }
      }
    });

    if (!author) throw new NotFoundException(`Author with ID ${id} not found`);
    return author;
  }
}