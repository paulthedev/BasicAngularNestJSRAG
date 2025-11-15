import { Controller, Get, Post, Param, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { multerPDFUploadOptions } from '../shared/config/multer.config';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('saveDocuments')
  @UseInterceptors(FilesInterceptor('images', 10, multerPDFUploadOptions)) // Allow up to 10 images
  async uploadImages(
    @Param('productId') productId: number,
    @Param('variationId') variationId: number,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new Error('No image files provided');
    }

    return { 
      type: 'success',
      message: 'Documents Saved successfully'
    }
  }
}

