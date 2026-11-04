// Common configuration for NUSKA_etno

export const config = {
  app: {
    name: 'NUSKA_etno',
    version: '0.1.0',
    environment: process.env.NODE_ENV || 'development',
  },
  api: {
    port: parseInt(process.env.PORT || '4000', 10),
    prefix: '/api',
  },
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/nuska_etno',
  },
};
