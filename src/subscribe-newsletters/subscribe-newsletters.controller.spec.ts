import { Test, TestingModule } from '@nestjs/testing';
import { SubscribeNewslettersController } from './subscribe-newsletters.controller';
import { SubscribeNewslettersService } from './subscribe-newsletters.service';

describe('SubscribeNewslettersController', () => {
  let controller: SubscribeNewslettersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscribeNewslettersController],
      providers: [SubscribeNewslettersService],
    }).compile();

    controller = module.get<SubscribeNewslettersController>(SubscribeNewslettersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
