import { 
  Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req, HttpStatus, HttpCode 
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/role.guards';
import { Roles } from 'src/auth/decorators/role.decorators';
import { Role } from 'generated/prisma/client';
import { Throttle } from '@nestjs/throttler';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  // ==========================================
  // 1. STATIC ROUTES (MUST BE AT THE TOP)
  // ==========================================

  @Get('trending')
  async findTrending() {
    return this.postsService.findTrending();
  }

  @Get('admin/stats') // <--- Moved UP
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.EDITOR)
  async getStats() {
    return this.postsService.getAdminStats();
  }

  @Get('admin/all') // <--- Moved UP
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.EDITOR)
  async findAllForAdmin() {
    return this.postsService.findAllForAdmin();
  }

  // ==========================================
  // 2. PUBLIC READ (General)
  // ==========================================

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('category') category?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  
  ) {
    return this.postsService.findAllPublished(
      Number(page), 
      Number(limit), 
      category,
      
    );
  }

  // ==========================================
  // 3. SPECIFIC IDENTIFIERS (Dynamic)
  // ==========================================

  // Specific route to fetch by ID (Used by Admin Edit Page)
  @Get('by-id/:id') // <--- RENAMED to avoid conflict with :slug
  async findOneById(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @Post(':id/view') // Specific action on an ID
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async view(@Param('id') id: string) {
    return this.postsService.incrementView(id);
  }

  // Catch-all for slugs (Must be last of the GET requests usually)
  @Get(':slug') 
  async findOne(@Param('slug') slug: string) {
    return this.postsService.findOneBySlug(slug);
  }

  // ==========================================
  // 4. WRITE OPERATIONS (Protected)
  // ==========================================
  
  @Post()
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createPostDto: CreatePostDto, @Req() req: any) {
    const userId = req.user.userId; // user.userId comes from JWT strategy
    return this.postsService.create(createPostDto, userId);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postsService.update(id, updatePostDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async remove(@Param('id') id: string) {
    return this.postsService.remove(id);
  }
}