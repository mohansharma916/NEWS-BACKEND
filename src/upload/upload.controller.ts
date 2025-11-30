import { 
  Controller, 
  Post, 
  UseInterceptors, 
  UploadedFile, 
  ParseFilePipe, 
  MaxFileSizeValidator, 
  FileTypeValidator, 
  UseGuards
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { AuthGuard } from '@nestjs/passport'; // Assumes you have Auth setup

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseGuards(AuthGuard('jwt')) // Protect this route!
  @UseInterceptors(FileInterceptor('file')) // 'file' matches the form-data key
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          // Validations: Max 5MB, only images
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), 
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const fileUrl = await this.uploadService.uploadFile(file);
    
    return {
      message: 'Upload successful',
      url: fileUrl, // Return this URL to frontend to save in "Create Post"
    };
  }
}