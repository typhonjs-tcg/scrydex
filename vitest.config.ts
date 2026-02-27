import {
   configDefaults,
   defineConfig } from 'vitest/config';

export default defineConfig({
   test: {
      exclude: [...configDefaults.exclude],
      include: ['./test/src/**/*.test.ts'],
      coverage: {
         include: ['src/**'],
         exclude: [
            'test/**',
            'src/cli/index.ts',
            'src/cli/wrap.ts',
            'src/data/scryfall/scryfallDownload.ts'
         ],
         provider: 'v8',
         reporter: ['text', 'json', 'html']
      },
      reporters: ['default', 'html'],
      globals: true,
      testTimeout: 40000,
      globalSetup: ['./test/src/global-setup.ts']
   }
});
