import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    port: 5173,
    hmr: {
      overlay: false,
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }

          if (id.includes("hls.js")) {
            return "media";
          }

          if (
            id.includes("react-router-dom") ||
            id.includes("react-dom") ||
            id.includes("/react/")
          ) {
            return "react-vendor";
          }

          if (id.includes("@tanstack/react-query")) {
            return "query";
          }

          if (
            id.includes("@radix-ui") ||
            id.includes("framer-motion") ||
            id.includes("lucide-react")
          ) {
            return "ui-vendor";
          }

          return "vendor";
        },
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(
    Boolean,
  ),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
