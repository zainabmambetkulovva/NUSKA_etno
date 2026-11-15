import { FileInterceptor } from '@nestjs/platform-express';

import { MAX_IMAGE_BYTES } from './image-file';

/**
 * Single file in field "file". Without `dest`/`storage` multer keeps the file
 * in memory; the size limit is enforced while streaming.
 */
export const ImageUploadInterceptor = FileInterceptor('file', {
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
});
