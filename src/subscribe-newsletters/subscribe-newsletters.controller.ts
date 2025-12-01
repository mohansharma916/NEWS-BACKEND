import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SubscribeNewslettersService } from './subscribe-newsletters.service';
import { CreateSubscribeNewsletterDto } from './dto/create-subscribe-newsletter.dto';

@Controller('subscribe-newsletters')
export class SubscribeNewslettersController {
  constructor(private readonly subscribeNewslettersService: SubscribeNewslettersService) {}

  @Post()
  create(@Body() createSubscribeNewsletterDto: CreateSubscribeNewsletterDto) {
    return this.subscribeNewslettersService.create(createSubscribeNewsletterDto);
  }

  @Get()
  findAll() {
    return this.subscribeNewslettersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subscribeNewslettersService.findOne(id);
  }

  @Patch(':id/unsubscribe')
  unsubscribe(@Param('id') id: string) {
    console.log(`Unsubscribing subscriber ID: ${id}`);
    return this.subscribeNewslettersService.unsubscribe(id);
  }
}