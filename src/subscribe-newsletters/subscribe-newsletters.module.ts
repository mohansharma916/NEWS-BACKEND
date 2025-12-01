import { Module } from '@nestjs/common';
import { SubscribeNewslettersService } from './subscribe-newsletters.service';
import { SubscribeNewslettersController } from './subscribe-newsletters.controller';

@Module({
  controllers: [SubscribeNewslettersController],
  providers: [SubscribeNewslettersService],
})
export class SubscribeNewslettersModule {}
