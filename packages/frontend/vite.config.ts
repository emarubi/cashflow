import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  server: {
    port: 3333,
    proxy: {
      "/graphql": {
        target: "http://localhost:4040",
        changeOrigin: true,
      },
    },
  },
});
