import { testDatabaseUrl } from './test-env';

const url = testDatabaseUrl();
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = url;
process.env.DIRECT_URL = url;
process.env.JWT_SECRET = 'e2e-test-secret-0123456789-abcdefghijklmnop';
process.env.JWT_EXPIRES_IN = '15m';
process.env.BCRYPT_ROUNDS = '4';
process.env.THROTTLE_DISABLED = 'true';
process.env.SWAGGER_ENABLED = 'false';
process.env.CORS_ORIGINS = 'http://localhost:3000';
process.env.WEB_URL = 'http://localhost:3000';
delete process.env.SMTP_HOST;
delete process.env.S3_BUCKET;
