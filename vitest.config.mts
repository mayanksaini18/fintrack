import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname) },
  },
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules/**', '.next/**'],
    // Each database test starts an in-memory Postgres; on a busy machine that can pass the 10 s default
    hookTimeout: 60_000,
    testTimeout: 30_000,
  },
});
