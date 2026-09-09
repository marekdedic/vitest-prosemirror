# Introduction

`vitest-prosemirror` is a plugin for [Vitest](https://vitest.dev/) that lets you
test a [ProseMirror](https://prosemirror.net/) editor the way your users
experience it — by typing, selecting, clicking and pasting into a genuine
editor, then asserting on the document that comes out.

## A real editor, not a model

ProseMirror is more than a document model. Keymaps, input rules, plugins, node
views and paste handling only run when there is an `EditorView` translating DOM
events into transactions. A test that builds a document and applies transactions
by hand skips all of that — exactly the layer most editor bugs live in.

`vitest-prosemirror` instead mounts a real `EditorView` inside
[jsdom](https://github.com/jsdom/jsdom) and drives it through the DOM:

- `type` dispatches real `keydown` / `keypress` / `keyup` events and
  synthesises the DOM mutation a browser would make, which ProseMirror reads back
  through its own input path — so your keymaps, input rules and `handleTextInput`
  hooks fire.
- `paste` and `copy` go through the real clipboard path (`handlePaste`,
  `transformPasted*`, the clipboard serializers), not a shortcut that replaces
  the selection directly.
- `click` dispatches a real bubbling event that reaches your node views' own
  listeners and `handleDOMEvents`.

The result is a test that behaves like the editor does in the browser, while
still reading like a unit test.

```ts
import { schema } from "prosemirror-schema-basic";
import { doc, p } from "prosemirror-test-builder";
import { renderProseMirror } from "vitest-prosemirror";
import { expect, test } from "vitest";

test("typing inserts text at the caret", () => {
  const editor = renderProseMirror(doc(p("Hello")));

  editor.setSelection("end");
  editor.type(" world");

  expect(editor.doc).toEqualProseMirrorNode(doc(p("Hello world")));
});
```

## What it is not

- **Not a headless model harness.** It needs a DOM, so your Vitest
  [environment](https://vitest.dev/config/#environment) must be `jsdom`. It is
  meant for editor-behaviour tests, not for exercising a
  schema in isolation — though the standalone
  [`parseHTML`](/guide/testing-parse-rules) helper covers testing `parseDOM`
  rules without a view.
- **Not a browser.** jsdom has no layout, so anything that depends on real
  geometry — vertical caret motion, word-wise cursor movement, coordinate-based
  click handlers — cannot be reproduced. Where that matters, the tester throws a
  clear error rather than quietly doing the wrong thing.

## Coming from jest-prosemirror?

The API will feel familiar, but the behaviour is deliberately different:
`vitest-prosemirror` runs the editor's real input, clipboard and DOM paths where
jest-prosemirror often takes shortcuts. If you are porting a suite,
[Migration from jest-prosemirror](/migration/from-jest-prosemirror) maps the
helpers and spells out the behavioural differences worth knowing before you start.

## Next steps

- [Getting started](/guide/getting-started) — install the package and write your
  first test.
- [Writing a test](/guide/writing-a-test) — the anatomy of a test: building
  documents, the tester's lifecycle, and describing selections.
- [API reference](/guide/api) — the full `renderProseMirror` surface, the custom
  matchers and the standalone helpers.
