import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    // @vitejs/plugin-react uses its own bundled Babel pipeline for JSX transforms.
    // When esbuild is disabled below, all JSX/TSX files go through this Babel
    // transform instead of the esbuild native binary — which crashes in some
    // Linux CI container environments (goroutine stack overflow / EPIPE).
    react(),
  ],

  esbuild: false,   // disable esbuild transform — Babel (via plugin-react) handles JSX

  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.js'],
    globals: true,
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    exclude: ['node_modules', 'dist', 'e2e'],
    pool: 'forks',   // belt-and-suspenders: isolate each test file in its own process
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
      exclude: [
        'node_modules/**',
        'dist/**',
        'e2e/**',
        '**/*.config.*',
        'src/__tests__/setup.js',
      ],
    },
  },
});
