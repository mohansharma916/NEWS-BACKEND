import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards, 
  HttpStatus, 
  HttpCode 
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AuthGuard } from '@nestjs/passport'; // Matches your Auth setup
import { Roles } from 'src/auth/decorators/role.decorators';
import { Role } from 'generated/prisma/client';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // ============================
  // PROTECTED ROUTES (Admin Only)
  // ============================

  @Post()
  @UseGuards(AuthGuard('jwt')) // Only logged-in users
  @Roles(Role.SUPER_ADMIN, Role.EDITOR)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @Roles(Role.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @Roles(Role.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }

  // ============================
  // PUBLIC ROUTES (Everyone)
  // ============================

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.categoriesService.findOne(slug);
  }
}