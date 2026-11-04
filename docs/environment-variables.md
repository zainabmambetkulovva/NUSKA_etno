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
| `DATABASE_URL` | - | PostgreSQL connection string (required) |

**Neon PostgreSQL example:**
```
postgresql://username:password@ep-xxx-xxx.aws.region.neon.tech/dbname?sslmode=require
```

### JWT Authentication

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | - | Secret key for JWT signing (required) |
| `JWT_EXPIRES_IN` | `7d` | Token expiration time |

### Encryption

| Variable | Default | Description |
|----------|---------|-------------|
| `BCRYPT_ROUNDS` | `10` | Number of bcrypt rounds |

### Feature Flags

| Variable | Default | Description |
|----------|---------|-------------|
| `ENABLE_THROTTLING` | `true` | Enable rate limiting |

## Frontend (.env.local)

### API Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | Backend API URL |

### Feature Flags

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_ENABLE_THROTTLING` | `true` | Enable client-side throttling |

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
DATABASE_URL="postgresql://username:password@ep-xxx-xxx.aws.region.neon.tech/dbname?sslmode=require"

# JWT
JWT_SECRET=super-secret-random-key-at-least-32-chars
JWT_EXPIRES_IN=7d

# Encryption
BCRYPT_ROUNDS=12
```
