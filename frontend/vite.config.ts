import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { fileURLToPath } from "node:url"
import path from "node:path"

const root = path.dirname(fileURLToPath(import.meta.url))

// `npm run dev`   -> demo page (frontend/index.html)
// `npm run build` -> single IIFE bundle + CSS in ../assets/liquid-navbar/,
//                    loaded by the static site's index.html (no build step on Netlify)
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": root },
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    outDir: path.resolve(root, "../_source/liquid-navbar"),
    emptyOutDir: true,
    sourcemap: false,
    lib: {
      entry: path.resolve(root, "src/main.tsx"),
      name: "AlKhorazmiyLiquidNav",
      formats: ["iife"],
      fileName: () => "liquid-navbar.js",
      cssFileName: "liquid-navbar",
    },
  },
})
