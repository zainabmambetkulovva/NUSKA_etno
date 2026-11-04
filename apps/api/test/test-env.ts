/**
 * E2E tests need a dedicated PostgreSQL database: every test truncates all
 * tables. To avoid wiping real data, the database name must contain "test".
 */
export function testDatabaseUrl(): string {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error(
      'Set TEST_DATABASE_URL to a dedicated PostgreSQL database, e.g. postgresql://postgres@localhost:5432/nuska_test'
    );
  }
  const dbName = new URL(url).pathname.replace(/^\//, '');
  if (!dbName.includes('test')) {
    throw new Error(
      `Refusing to run e2e tests against "${dbName}": the database name must contain "test"`
    );
  }
  return url;
}
