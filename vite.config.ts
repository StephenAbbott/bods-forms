import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5273,
    strictPort: true,
    proxy: {
      "/api/validate": {
        target: process.env.VALIDATOR_URL || "http://localhost:10000",
        changeOrigin: true,
      },
    },
  },
});
