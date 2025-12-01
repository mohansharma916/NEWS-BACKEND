import { Test, TestingModule } from '@nestjs/testing';
import { SubscribeNewslettersService } from './subscribe-newsletters.service';

describe('SubscribeNewslettersService', () => {
  let service: SubscribeNewslettersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SubscribeNewslettersService],
    }).compile();

    service = module.get<SubscribeNewslettersService>(SubscribeNewslettersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
