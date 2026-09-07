import { defineConfig } from "vitepress";

export default defineConfig({
  base: "/vitest-prosemirror/",
  description:
    "A plugin for Vitest that enables you to write tests using the ProseMirror editor",
  lastUpdated: true,
  themeConfig: {
    editLink: {
      pattern:
        "https://github.com/marekdedic/vitest-prosemirror/edit/master/docs/:path",
      text: "Edit this page on GitHub",
    },
    nav: [
      { link: "/guide/getting-started", text: "Guide" },
      { link: "/guide/api", text: "API" },
    ],
    search: {
      provider: "local",
    },
    sidebar: [
      {
        items: [
          { link: "/guide/getting-started", text: "Getting started" },
        ],
        text: "Guide",
      },
      {
        items: [{ link: "/guide/api", text: "API reference" }],
        text: "Reference",
      },
    ],
    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/marekdedic/vitest-prosemirror",
      },
    ],
  },
  title: "vitest-prosemirror",
});
