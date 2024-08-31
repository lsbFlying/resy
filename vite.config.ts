import { defineConfig } from "vite";

export default defineConfig({
  mode: "development",
  server: {
    open: true,
    port: 3000,
    host: "localhost",
  },
  resolve: {
    alias: {
      // for dev
      "react-platform": "react-dom",
    }
  },
});
