/// <reference types="vitest/config" />

import { readFileSync, writeFileSync } from "fs";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: "src/index",
      formats: ["es"],
      name: "vitest-prosemirror",
    },
    minify: false,
    rollupOptions: {
      external: [
        "prosemirror-model",
        "prosemirror-state",
        "prosemirror-view",
        "stringify-object",
        "test-keyboard",
        "vitest",
      ],
    },
    sourcemap: true,
  },
  plugins: [
    dts({ rollupTypes: true }),
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
