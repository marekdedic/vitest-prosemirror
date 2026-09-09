# Getting started

This page gets `vitest-prosemirror` installed and walks you through a first test.
For *why* it drives a real editor rather than the document model, see the
[Introduction](/guide/introduction).

## Installation

```sh
npm install --save-dev vitest-prosemirror prosemirror-test-builder
```

[`prosemirror-test-builder`](https://github.com/ProseMirror/prosemirror-test-builder)
is what the examples throughout this guide use to write documents concisely
(`doc(p("…"))`); it's optional, but recommended.

The package uses jsdom, so make sure your Vitest config uses the `jsdom`
environment:

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
  },
});
```

Load `vitest-prosemirror/setup` once from a
[setup file](https://vitest.dev/config/#setupfiles) so its custom matchers and
snapshot serializers are registered for every test:

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["vitest-prosemirror/setup"],
  },
});
```

The main `vitest-prosemirror` entry has no side effects — it only exports the
API you import in your tests. Registering the matchers and the automatic
per-test cleanup is what `vitest-prosemirror/setup` does, which is why it goes in
`setupFiles` rather than being pulled in by importing the package.

## Your first test

Build a starting document, hand it to `renderProseMirror`, and drive it like a
user:

```ts
import { doc, p } from "prosemirror-test-builder";
import { renderProseMirror } from "vitest-prosemirror";
import { expect, test } from "vitest";

test("typing inserts text at the selection", () => {
  const editor = renderProseMirror(doc(p("Hello")));

  editor.setSelection("end");
  editor.type(" world");

  expect(editor.doc).toEqualProseMirrorNode(doc(p("Hello world")));
});
```

`setSelection` positions the caret before you type — here at the end of the
document. See
[describing selections](/guide/writing-a-test#describing-selections) for every
form it accepts.

## What next?

- [Writing a test](/guide/writing-a-test) — building documents, the tester's
  lifecycle, and selections in depth.
- [Simulating input](/guide/simulating-input) — typing and key syntax, commands,
  input rules, and the clipboard.
- [Assertions & snapshots](/guide/assertions) — the matchers and snapshot
  serializers you'll assert with.
- [API reference](/guide/api) — the full `renderProseMirror` surface in one place.
