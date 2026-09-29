import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'node',
      environmentMatchGlobs: [['**/*.spec.tsx', 'jsdom']],
      setupFiles: ['./vitest.setup.ts'],
    },
  }),
);
