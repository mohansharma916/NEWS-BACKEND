import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query, 
  UseGuards, 
  Req,
  HttpStatus,
  HttpCode
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
  // PUBLIC ROUTES (Reading News)
  // ==========================================

@Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('category') category?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    // Convert strings to numbers
    return this.postsService.findAllPublished(
      Number(page), 
      Number(limit), 
      category
    );
  }

  @Get('trending')
  async findTrending() {
    return this.postsService.findTrending();
  }

  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    return this.postsService.findOneBySlug(slug);
  }

  // ==========================================
  // PROTECTED ROUTES (Admin Panel)
  // ==========================================
  
  @Post()
  @UseGuards(AuthGuard('jwt')) // <--- PROTECT THIS ROUTE
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createPostDto: CreatePostDto, @Req() req: any) {
    // PRO TIP: In a real app, never trust the frontend to send the Author ID.
    // Extract it from the JWT token attached to the request.
    const userId = req.user.userId; 
    
    // FOR NOW (Temporary hardcoded ID for testing until Auth is ready):
    // Use the ID of the Admin user we created in the Seed file
    // const tempAdminId = "REPLACE_WITH_ID_FROM_DB_SEED"; 

    return this.postsService.create(createPostDto, userId);
  }

  @Post(':id/view')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async view(@Param('id') id: string) {
    return this.postsService.incrementView(id);
  }


  @Get('admin/stats')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.EDITOR)
  async getStats() {
    return this.postsService.getAdminStats();
  }




  @Patch(':id')
  @UseGuards(AuthGuard('jwt')) // <--- PROTECT THIS ROUTE
  async update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postsService.update(id, updatePostDto);
  }

  @Get('admin/all') // Route: /posts/admin/all
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.EDITOR)
  async findAllForAdmin() {
    return this.postsService.findAllForAdmin();
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt')) // <--- PROTECT THIS ROUTE
  async remove(@Param('id') id: string) {
    return this.postsService.remove(id);
  }
}