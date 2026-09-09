# Migration from jest-prosemirror

If you have tests written with
[jest-prosemirror](https://remirror.io/docs/api/jest-prosemirror/), the concepts
carry over directly — build a document, act on the editor, assert on the result.
Two things change: the shape of the API (a chainable editor becomes an imperative
tester), and the behaviour underneath (more of the editor's real paths actually
run). This page covers both.

## Setup

Swap the test-time dependency and point Vitest at a DOM environment:

- Use the `jsdom`
  [environment](https://vitest.dev/config/#environment) — the tester mounts a real
  `EditorView`, so it needs a DOM.
- Register the package from a
  [setup file](/guide/getting-started#installation) so its matchers and snapshot
  serializers are available everywhere.
- Both libraries clean up automatically after each test, so there's nothing to
  change there — see [cleanup](/guide/writing-a-test#cleanup) for the one case
  (a tester kept alive across tests) that needs attention.

One import to note: jest-prosemirror ships its own `doc` / `p` builders, whereas
`vitest-prosemirror` leaves document-building to
[`prosemirror-test-builder`](/guide/writing-a-test#building-documents) directly.
Import the builders from there.

## The shape of a test

jest-prosemirror chains actions on an editor and reads state inside a
`.callback()`:

```ts
import { createEditor, doc, p } from "jest-prosemirror";

test("typing inserts text", () => {
  createEditor(doc(p("Hello<cursor>")))
    .insertText(" world")
    .callback((content) => {
      expect(content.state.doc).toEqualProsemirrorNode(doc(p("Hello world")));
    });
});
```

`vitest-prosemirror` uses a plain object with getters — act, then read the state
directly. There's no callback, and note the added `setSelection("cursor")` (see
the next section):

```ts
import { doc, p } from "prosemirror-test-builder";
import { renderProseMirror } from "vitest-prosemirror";
import { expect, test } from "vitest";

test("typing inserts text", () => {
  const editor = renderProseMirror(doc(p("Hello<cursor>")));

  editor.setSelection("cursor");
  editor.type(" world");

  expect(editor.doc).toEqualProseMirrorNode(doc(p("Hello world")));
});
```

## Selection tags don't set the selection on their own

This is the easiest thing to miss when porting. In jest-prosemirror, `createEditor`
runs the tagged document through `initSelection`, so a `<cursor>` (or
`<anchor>` / `<head>`, `<node>`, `<all>`, …) tag **becomes the editor's initial
selection automatically** — `createEditor(doc(p("Hello<cursor>"))).insertText("!")`
types at the cursor.

`vitest-prosemirror` does not do this. The tags are still recorded on the
document, but the constructor leaves the selection at its default (the document
start). You turn a tag into a selection **explicitly**, with
[`setSelection`](/guide/writing-a-test#describing-selections):

```ts
const editor = renderProseMirror(doc(p("Hello<cursor>")));

editor.setSelection("cursor"); // ← without this, typing lands at the start
editor.type("!");
```

So every ported test that relied on a tag positioning the caret needs a
`setSelection(...)` call added after construction — `setSelection("cursor")` for a
`<cursor>`, `setSelection({ anchor: "a", head: "b" })` for a tagged range, and so
on.

## API mapping

| jest-prosemirror                     | vitest-prosemirror                                        |
| ------------------------------------ | --------------------------------------------------------- |
| `createEditor(doc, options)`         | `renderProseMirror(doc, options)`                         |
| `.insertText("x")`                   | `editor.type("x")`                                  |
| `.press("Enter")`                    | `editor.type("{Enter}")`                            |
| `.shortcut("Mod-b")`                 | `editor.type("{Mod-b}")`                            |
| `.jumpTo(pos)` / `.jumpTo(a, b)`     | `editor.setSelection(pos)` / `editor.setSelection({ anchor, head })` |
| `.command(cmd)`                      | `editor.command(cmd)`                                     |
| `.paste(content)`                    | `editor.paste(content)`                                   |
| `.fire({ event: "click", … })`       | `editor.click(target)`                                    |
| `.overwrite(doc)`                    | call `renderProseMirror` again                            |
| `.callback((c) => c.state…)`         | read `editor.state` / `editor.doc` directly               |
| `doc`, `p` from `jest-prosemirror`   | `doc`, `p` from `prosemirror-test-builder`                |

Keyboard input folds together: jest-prosemirror's separate `press` and `shortcut`
become part of [`type`](/guide/simulating-input#special-keys)'s key syntax,
so a keypress is `{Enter}` and a chord is `{Mod-b}`, interleavable with typed
text in one call.

## Matchers

The document matcher is the same idea with a corrected spelling — note the capital
**M** in ProseMirror:

```ts
// jest-prosemirror
expect(content.state.doc).toEqualProsemirrorNode(doc(p("Hello world")));

// vitest-prosemirror
expect(editor.doc).toEqualProseMirrorNode(doc(p("Hello world")));
```

Two differences to know:

- `toEqualProseMirrorNode` additionally checks that both documents share a
  **schema instance** (see [schema identity](/guide/assertions#schema-identity)).
  If a previously-passing test built its expected document from a different schema,
  it will now flag that.
- There's no `toTransformNode`. Run the command with `command(...)` and assert on
  the resulting document with `toEqualProseMirrorNode`. For selections,
  `vitest-prosemirror` adds a dedicated
  [`toHaveSelection`](/guide/assertions#tohaveselection) matcher.

## Behaviour that changes

The API mapping is mechanical; this part is the reason to read before porting.
`vitest-prosemirror` drives the editor's **real** input, clipboard and DOM paths,
where jest-prosemirror often takes a shortcut. Tests that relied on the shortcut
may behave differently — usually more correctly:

- **Pasting** runs the full paste path — `handlePaste`, `transformPasted*`, the
  clipboard parsers and the paste transaction metadata — rather than replacing
  the selection with the pasted slice directly. If your editor's paste behaviour
  lives in a `handlePaste` handler, it now actually runs (and is now testable).
  See [the clipboard](/guide/simulating-input#clipboard).
- **Typing** synthesises the DOM edit a browser would make and lets ProseMirror
  read it back through its input path, so input rules and `handleTextInput` fire
  as they do in the browser.
- **Keys that can't be reproduced in jsdom throw** instead of silently doing
  nothing. Vertical caret motion, word/line motion and layout-dependent keys have
  no faithful headless behaviour, so the tester refuses rather than pass a test
  for the wrong reason. See
  [what a key actually does](/guide/simulating-input#what-a-key-actually-does).

## Next steps

- [Writing a test](/guide/writing-a-test) — the tester, documents and selections
  in full.
- [Simulating input](/guide/simulating-input) — the complete `type` syntax,
  commands and the clipboard.
