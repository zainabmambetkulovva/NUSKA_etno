import { randomUUID } from 'node:crypto';

import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AppError } from '../common/errors';

import { detectImageType, MAX_IMAGE_BYTES } from './image-file';

export interface StoredFile {
  url: string;
  key: string;
  mimeType: string;
  sizeBytes: number;
}

export type UploadFolder = 'products' | 'categories' | 'banners' | 'content';

/**
 * Stores files in S3-compatible storage (AWS S3, Cloudflare R2, MinIO, ...).
 * Only URLs and metadata are written to PostgreSQL (TZ §18).
 */
@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly client: S3Client | null;
  private readonly bucket?: string;
  private readonly publicUrl?: string;

  constructor(config: ConfigService) {
    this.bucket = config.get<string>('S3_BUCKET');
    this.publicUrl = config.get<string>('S3_PUBLIC_URL')?.replace(/\/$/, '');
    const accessKeyId = config.get<string>('S3_ACCESS_KEY_ID');
    const secretAccessKey = config.get<string>('S3_SECRET_ACCESS_KEY');

    if (this.bucket && this.publicUrl && accessKeyId && secretAccessKey) {
      this.client = new S3Client({
        region: config.get<string>('S3_REGION') || 'auto',
        endpoint: config.get<string>('S3_ENDPOINT') || undefined,
        forcePathStyle: config.get<string>('S3_FORCE_PATH_STYLE') === 'true',
        credentials: { accessKeyId, secretAccessKey },
      });
    } else {
      this.client = null;
      this.logger.warn('S3 storage is not configured: image uploads are disabled');
    }
  }

  async uploadImage(
    file: Express.Multer.File | undefined,
    folder: UploadFolder
  ): Promise<StoredFile> {
    if (!file?.buffer) throw AppError.badRequest('FILE_REQUIRED', 'A file is required');
    if (file.size > MAX_IMAGE_BYTES)
      throw AppError.badRequest('FILE_TOO_LARGE', 'Maximum file size is 5 MB');

    const type = detectImageType(file.buffer);
    if (!type)
      throw AppError.badRequest(
        'UNSUPPORTED_FILE_TYPE',
        'Only JPEG, PNG and WebP images are allowed'
      );

    const client = this.requireClient();
    const key = `${folder}/${randomUUID()}.${type.ext}`;
    await client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: type.mime,
        CacheControl: 'public, max-age=31536000, immutable',
      })
    );
    return { url: `${this.publicUrl}/${key}`, key, mimeType: type.mime, sizeBytes: file.size };
  }

  /** Best-effort delete: a storage failure must not block removing the database record. */
  async delete(key: string | null | undefined) {
    if (!key || !this.client) return;
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch (error) {
      this.logger.error(`Failed to delete ${key} from storage: ${(error as Error).message}`);
    }
  }

  private requireClient(): S3Client {
    if (!this.client) {
      throw new ServiceUnavailableException({
        statusCode: 503,
        code: 'STORAGE_NOT_CONFIGURED',
        message: 'File storage is not configured',
      });
    }
    return this.client;
  }
}
