import { execSync } from 'node:child_process';
import { join } from 'node:path';

import { testDatabaseUrl } from './test-env';

export default function globalSetup() {
  const url = testDatabaseUrl();
  execSync(`"${join(__dirname, '..', 'node_modules', '.bin', 'prisma')}" migrate deploy`, {
    cwd: join(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
    stdio: 'pipe',
  });
}
