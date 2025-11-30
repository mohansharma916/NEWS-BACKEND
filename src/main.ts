import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);


  app.set('trust proxy', 1);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Strips away properties that don't exist in the DTO (Security!)
    forbidNonWhitelisted: true, // Throws error if unknown properties are sent
    transform: true, // Automatically converts payloads to DTO instances
  }));

  app.enableCors({
    // A. ALLOWED ORIGINS
    // In dev: Allow your frontend localhost ports
    // In prod: Use an ENV variable (e.g. 'https://theviewisland.com')
    origin: [
      'http://localhost:3000', // Next.js default
      process.env.FRONTEND_URL || '', // Production URL from .env
    ],

    // B. ALLOWED METHODS
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',

    // C. ALLOWED HEADERS
    // 'Authorization' is crucial for your JWT to pass through
    allowedHeaders: 'Content-Type, Accept, Authorization',

    // D. CREDENTIALS
    // Set to true if you ever need to pass Cookies (good for future proofing)
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
