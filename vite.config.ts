/// <reference types="vitest/config" />

import { copyFileSync } from "fs";
import dts from "unplugin-dts/vite";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: { index: "src/index", setup: "src/setup" },
      formats: ["es"],
    },
    minify: false,
    rollupOptions: {
      external: [
        "prosemirror-model",
        "prosemirror-state",
        "prosemirror-view",
        "stringify-object",
        "vitest",
      ],
    },
    // Node 20 is the floor; ES2023 is the newest it fully supports.
    target: "es2023",
  },
  plugins: [
    dts({
      bundleTypes: true,
      exclude: ["src/setup.ts", "src/matchers.d.ts", "node_modules/**"],
    }),
    {
      closeBundle: (): void => {
        copyFileSync("src/matchers.d.ts", "dist/setup.d.ts");
      },
      name: "setup-dts",
    },
  ],
  test: {
    environment: process.env["VITEST_ENVIRONMENT"] ?? "jsdom",
    mockReset: true,
    setupFiles: ["src/setup.ts"],
  },
});
