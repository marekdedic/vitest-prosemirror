# Getting started

`vitest-prosemirror` lets you write Vitest tests that drive a real ProseMirror
`EditorView` running inside jsdom. Because it exercises ProseMirror's real input
path — DOM events, transactions, plugins and node views — your tests behave the
way the editor does in the browser.

## Installation

```sh
npm install --save-dev vitest-prosemirror
```

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

Import `vitest-prosemirror` once from a
[setup file](https://vitest.dev/config/#setupfiles) so its custom matchers and
snapshot serializers are registered for every test:

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["vitest-prosemirror"],
  },
});
```

## Your first test

Build a starting document from your schema, hand it to a `ProseMirrorTester`,
and drive it like a user:

```ts
import { schema } from "prosemirror-schema-basic";
import { ProseMirrorTester } from "vitest-prosemirror";
import { expect, test } from "vitest";

test("typing inserts text at the selection", () => {
  const editor = new ProseMirrorTester(
    schema.node("doc", null, [
      schema.node("paragraph", null, [schema.text("Hello")]),
    ]),
  );

  editor.selectText("end");
  editor.insertText(" world");

  expect(editor.doc).toEqualProseMirrorNode(
    schema.node("doc", null, [
      schema.node("paragraph", null, [schema.text("Hello world")]),
    ]),
  );
});
```

`selectText` positions the caret before you type — here at the end of the
document. See [selections](/guide/api#selections) in the API reference for every
form it accepts.

## What next?

- Read the [API reference](/guide/api) for the full `ProseMirrorTester` surface,
  the custom matchers, and the standalone helpers.
- The tester passes any `EditorProps` straight through to the underlying
  `EditorView`, so `nodeViews`, `markViews`, `handleDOMEvents`, `editable` and
  the rest work exactly as in production.
