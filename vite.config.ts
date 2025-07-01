import { defineConfig } from "vite";

export default defineConfig({
  mode: "development",
  server: {
    open: true,
    port: 3000,
    host: "localhost",
  },
  define: {
    /**
     * @desc At present, the project dependency package RN contains
     * a globally declared __DEV__ variable type declaration,
     * which can be used directly without the need to
     * create a ` vite-env. d.ts ` file for global variable type declaration.
     */
    __DEV__: "true",
  },
  resolve: {
    alias: {
      // for dev
      "react-platform": "react-dom",
    }
  },
});
