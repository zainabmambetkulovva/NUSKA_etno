import {
  Controller,
  Post,
  Delete,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../auth/decorators/role.decorator';
import { UserRole } from '@prisma/client';
import { S3Service } from './s3.service';

@Controller('uploads')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UploadsController {
  constructor(private readonly s3Service: S3Service) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  @Role(UserRole.ADMIN)
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const result = await this.s3Service.uploadFile(file);
    return {
      message: 'File uploaded successfully',
      ...result,
    };
  }

  @Post('images')
  @UseInterceptors(FilesInterceptor('files', 10))
  @Role(UserRole.ADMIN)
  async uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const results = await this.s3Service.uploadFiles(files);
    return {
      message: 'Files uploaded successfully',
      files: results,
    };
  }

  @Post('product-image')
  @UseInterceptors(FileInterceptor('file'))
  @Role(UserRole.ADMIN)
  async uploadProductImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const result = await this.s3Service.uploadProductImage(file);
    return {
      message: 'Product image uploaded successfully',
      ...result,
    };
  }

  @Post('category-image')
  @UseInterceptors(FileInterceptor('file'))
  @Role(UserRole.ADMIN)
  async uploadCategoryImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const result = await this.s3Service.uploadCategoryImage(file);
    return {
      message: 'Category image uploaded successfully',
      ...result,
    };
  }

  @Delete('file')
  @Role(UserRole.ADMIN)
  async deleteFile(@Body('key') key: string) {
    if (!key) {
      throw new BadRequestException('No file key provided');
    }

    await this.s3Service.deleteFile(key);
    return {
      message: 'File deleted successfully',
    };
  }

  @Delete('files')
  @Role(UserRole.ADMIN)
  async deleteFiles(@Body('keys') keys: string[]) {
    if (!keys || keys.length === 0) {
      throw new BadRequestException('No file keys provided');
    }

    await this.s3Service.deleteFiles(keys);
    return {
      message: 'Files deleted successfully',
    };
  }
}
