/// <reference types="vitest/config" />

import { readFileSync, writeFileSync } from "fs";
import dts from "unplugin-dts/vite";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: "src/index",
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
    dts({ bundleTypes: true }),
    {
      closeBundle: (): void => {
        let file = readFileSync("dist/vitest-prosemirror.d.ts", "utf8");
        file = `import 'vitest';\n${file}`;
        writeFileSync("dist/vitest-prosemirror.d.ts", file, "utf8");
      },
      name: "pure-import-fixer",
    },
  ],
  test: {
    environment: "jsdom",
    mockReset: true,
  },
});
