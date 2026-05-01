import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/widget.js"),
      name: "AgentixWidget",
      formats: ["iife"],
      fileName: () => "widget.js",
    },
    outDir: "../web/public",
    emptyOutDir: false, // Ensures we don't accidentally delete other Next.js public assets
  },
});
