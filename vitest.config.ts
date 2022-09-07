import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    setupFiles: "setupTests.ts",
  },
  resolve: {
    alias: {
      // for test
      "react-platform": "react-dom",
    }
  },
});
