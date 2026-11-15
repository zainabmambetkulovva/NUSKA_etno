/**
 * Production entry point (Docker image CMD).
 *
 * With MIGRATE_ON_START=true, pending Prisma migrations are applied before the
 * API starts. Used on hosts without a separate release step (Render free plan).
 * If a migration fails the process exits and the new version does not start.
 */
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const root = join(__dirname, '..');

if (process.env.MIGRATE_ON_START === 'true') {
  const cli = join(root, 'node_modules', 'prisma', 'build', 'index.js');
  const result = spawnSync(process.execPath, [cli, 'migrate', 'deploy'], {
    cwd: root,
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    console.error('Database migrations failed: the API is not started.');
    process.exit(result.status ?? 1);
  }
}

// Loaded only after the migrations finished.
void import('./main');
