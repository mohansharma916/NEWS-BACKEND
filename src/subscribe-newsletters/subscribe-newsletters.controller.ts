import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { SubscribeNewslettersService } from './subscribe-newsletters.service';
import { CreateSubscribeNewsletterDto } from './dto/create-subscribe-newsletter.dto';
import { RolesGuard } from 'src/auth/guards/role.guards';
import { Role } from 'generated/prisma/client';
import { Roles } from 'src/auth/decorators/role.decorators';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';

@Controller('subscribe-newsletters')
export class SubscribeNewslettersController {
  constructor(private readonly subscribeNewslettersService: SubscribeNewslettersService) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  create(@Body() createSubscribeNewsletterDto: CreateSubscribeNewsletterDto) {
    return this.subscribeNewslettersService.create(createSubscribeNewsletterDto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.EDITOR)
  findAll() {
    return this.subscribeNewslettersService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.EDITOR)
  findOne(@Param('id') id: string) {
    return this.subscribeNewslettersService.findOne(id);
  }

  @Patch(':id/unsubscribe')
  unsubscribe(@Param('id') id: string) {
    console.log(`Unsubscribing subscriber ID: ${id}`);
    return this.subscribeNewslettersService.unsubscribe(id);
  }
}