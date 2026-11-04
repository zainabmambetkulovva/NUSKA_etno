# Environment Variables

## Backend (.env)

### Core Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode |
| `PORT` | `4000` | Backend server port |

### CORS

| Variable | Default | Description |
|----------|---------|-------------|
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated list of allowed origins |

### Database

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | - | PostgreSQL connection string used by the app (required). On Neon use the **pooled** URL |
| `DIRECT_URL` | - | Direct (non-pooled) connection string used by Prisma Migrate (required) |

**Neon PostgreSQL example:**
```
DATABASE_URL=postgresql://USER:PASSWORD@ep-xxxx-pooler.REGION.aws.neon.tech/DBNAME?sslmode=require
DIRECT_URL=postgresql://USER:PASSWORD@ep-xxxx.REGION.aws.neon.tech/DBNAME?sslmode=require
```

### JWT Authentication

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | - | Secret key for JWT signing (required, no default) |
| `JWT_EXPIRES_IN` | `15m` | Access token lifetime |

### Encryption

| Variable | Default | Description |
|----------|---------|-------------|
| `BCRYPT_ROUNDS` | `12` | Number of bcrypt rounds |

### Seed (development only)

| Variable | Default | Description |
|----------|---------|-------------|
| `SEED_ADMIN_EMAIL` | `admin@example.com` | Demo admin e-mail |
| `SEED_ADMIN_PASSWORD` | random | Demo admin password; generated and printed once if empty |
| `SEED_CUSTOMER_EMAIL` | `customer@example.com` | Demo customer e-mail |
| `SEED_CUSTOMER_PASSWORD` | random | Demo customer password; generated and printed once if empty |

## Frontend (.env.local)

### API Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | Backend API URL |

## Security Guidelines

1. **NEVER commit secrets** - Use `.env.example` as template
2. **Rotate JWT_SECRET** in production regularly
3. **Restrict CORS_ORIGINS** to production domains only
4. **Use SSL** in production (`sslmode=require`)
5. **Change BCrypt rounds** based on security requirements

## Example .env File

```env
# Environment
NODE_ENV=production
PORT=4000

# CORS (restrict in production)
CORS_ORIGINS=https://yourdomain.com

# Database
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxxx-pooler.REGION.aws.neon.tech/DBNAME?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@ep-xxxx.REGION.aws.neon.tech/DBNAME?sslmode=require"

# JWT
JWT_SECRET=<openssl rand -base64 48>
JWT_EXPIRES_IN=15m

# Encryption
BCRYPT_ROUNDS=12
```
