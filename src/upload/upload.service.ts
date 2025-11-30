import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid'; // npm install uuid

@Injectable()
export class UploadService {
  private readonly s3Client: S3Client;
  private readonly logger = new Logger(UploadService.name);

  constructor(private readonly configService: ConfigService) {
    // Initialize AWS S3 Client
    this.s3Client = new S3Client({
      region: this.configService.getOrThrow('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.getOrThrow('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.getOrThrow('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const destination = this.configService.get('UPLOAD_DESTINATION');
    const filename = `${uuidv4()}-${file.originalname.replace(/\s+/g, '-')}`;
    if (destination === 's3') {
      return this.uploadToS3(file, filename);
    } else {
      console.log('Uploading to local storage');
      return this.uploadToLocal(file, filename);
    }
  }

  // Option A: Upload to AWS S3
  private async uploadToS3(file: Express.Multer.File, filename: string): Promise<string> {
    const bucket = this.configService.getOrThrow('AWS_BUCKET_NAME');
    const region = this.configService.getOrThrow('AWS_REGION');

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: filename,
          Body: file.buffer,
          ContentType: file.mimetype,
          // ACL: 'public-read', // Uncomment if your bucket allows ACLs
        }),
      );

      // Construct public URL
      return `https://${bucket}.s3.${region}.amazonaws.com/${filename}`;
    } catch (error) {
      this.logger.error(`S3 Upload Error: ${error.message}`);
      throw new InternalServerErrorException('File upload to S3 failed');
    }
  }

  // Option B: Upload Locally (Fallback)
private async uploadToLocal(file: Express.Multer.File, filename: string): Promise<string> {
    try {
      const uploadPath = path.join(`${process.cwd()}/dist` ,'uploads');

      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      const fullPath = path.join(uploadPath, filename);
      fs.writeFileSync(fullPath, file.buffer);

      // --- THE FIX ---
      // Get the backend URL from env, or default to localhost:3001
      // Ideally, add BACKEND_URL="http://localhost:3001" to your .env
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
      
      // Return the full accessible URL
      return `${backendUrl}/uploads/${filename}`; 
      
    } catch (error) {
      this.logger.error(`Local Upload Error: ${error.message}`);
      throw new InternalServerErrorException('Local file upload failed');
    }
  }
}