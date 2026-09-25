import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    testTimeout: 15000,
    setupFiles: ['src/setup-vitest.ts'],
    include: ['src/**/*.spec.ts'],
  }
});
