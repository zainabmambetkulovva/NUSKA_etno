import { Controller, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsIn } from 'class-validator';

import { Roles } from '../common/decorators/roles.decorator';

import { ImageUploadInterceptor } from './image-upload.interceptor';
import { UploadFolder, UploadsService } from './uploads.service';

class UploadQueryDto {
  @IsIn(['categories', 'banners', 'content', 'testimonials'])
  folder!: Exclude<UploadFolder, 'products'>;
}

/** Generic image upload for categories, banners, site content and testimonials. Product images use /admin/products/:id/images. */
@ApiTags('admin')
@Roles(UserRole.ADMIN)
@Controller('admin/uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post('image')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } },
  })
  @UseInterceptors(ImageUploadInterceptor)
  async upload(@Query() query: UploadQueryDto, @UploadedFile() file: Express.Multer.File) {
    const stored = await this.uploads.uploadImage(file, query.folder);
    return { url: stored.url, key: stored.key };
  }
}
