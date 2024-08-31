import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    setupFiles: "setupTests.ts",
    environment: "jsdom",
    coverage: {
      include: ["src/*"],
      exclude: [
        "src/types.ts",
        "src/classConnect/types.ts",
        "src/platforms/*.ts",
        "src/restore/types.ts",
        "src/scheduler/types.ts",
        "src/store/types.ts",
        "src/subscribe/types.ts",
        "src/signal/types.ts",
      ],
    },
    // reporters: ["html"],
  },
  resolve: {
    alias: {
      // for test
      "react-platform": "react-dom",
    }
  },
});
