import { Controller, Post, UploadedFile, UseInterceptors, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@prisma/client';

import { Role } from '../auth/decorators/role.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('uploads')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UploadsController {
  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  @Role(UserRole.ADMIN)
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    // TODO: Implement image upload with S3-compatible storage
    return { message: 'Upload image - to be implemented', filename: file?.originalname };
  }
}
