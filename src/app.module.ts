import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PostsModule } from './posts/posts.module';
import { CategoriesModule } from './categories/categories.module';
import { PrismaService } from './prisma/prisma.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UploadModule } from './upload/upload.module';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static'; // <--- IMPORT
import { join } from 'path'; // <--- IMPORT
import { ThrottlerModule } from '@nestjs/throttler';
import { SubscribeNewslettersModule } from './subscribe-newsletters/subscribe-newsletters.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // <--- CRITICAL: Makes .env available everywhere
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'), // Path to folder on disk
      serveRoot: '/uploads', // URL prefix (e.g. http://localhost:3001/uploads/...)
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000, // Time to Live (in milliseconds) -> 1 Minute
      limit: 60,  // Max requests per TTL -> 60 requests
    }]),
    PrismaModule,
    PostsModule, 
    CategoriesModule, 
    UsersModule,
    AuthModule, 
    UploadModule, SubscribeNewslettersModule
    ],
  controllers: [AppController],
  providers: [AppService,PrismaService],
})
export class AppModule {}
