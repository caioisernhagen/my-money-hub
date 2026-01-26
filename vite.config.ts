import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Define a base dinamicamente:
  // No GitHub Pages (produção), usa o nome do repositório.
  // Localmente (desenvolvimento), usa a raiz '/'.
  base: mode === "production" ? "/my-money-hub/" : "/",

  server: {
    host: "::",
    port: 8080,
  },

  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // Copy 404.html to dist folder for GitHub Pages SPA routing
    {
      name: "copy-404",
      apply: "build",
      generateBundle() {
        const content = fs.readFileSync(
          path.resolve(__dirname, "404.html"),
          "utf-8",
        );
        this.emitFile({
          type: "asset",
          fileName: "404.html",
          source: content,
        });
      },
    },
  ].filter(Boolean),

  resolve: {
    alias: {
      // Permite usar '@' como atalho para a pasta 'src'
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    rollupOptions: {
      // Garante que service-worker.js e manifest.json não sejam processados
      input: {
        main: path.resolve(__dirname, "index.html"),
      },
    },
  },
}));
