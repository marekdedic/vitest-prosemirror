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
  plugins: [dts({ rollupTypes: true })],
  test: {
    environment: "jsdom",
    mockReset: true,
  },
});
