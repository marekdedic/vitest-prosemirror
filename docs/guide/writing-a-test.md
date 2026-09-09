# Writing a test

Every `vitest-prosemirror` test has the same shape: build a starting document,
hand it to a `ProseMirrorTester`, act on the editor, and assert on the result.
This page covers the three pieces you need for the "arrange" and "act" halves —
building documents, the tester itself, and describing selections. Assertions get
their own [chapter](/guide/assertions).

## Building documents

You can build a document with the raw schema API
(`schema.node("paragraph", null, [schema.text("hi")])`), but that gets verbose
fast. The idiomatic choice is
[`prosemirror-test-builder`](https://github.com/ProseMirror/prosemirror-test-builder),
which gives you a concise builder function per node and mark type:

```ts
import { doc, p, strong } from "prosemirror-test-builder";

const document = doc(p("Hello ", strong("world")));
```

`prosemirror-test-builder`'s pre-exported `doc`, `p`, … are bound to a small
demo schema. To test **your** schema, create builders from it:

```ts
import { builders } from "prosemirror-test-builder";

import { mySchema } from "../src/schema";

const { doc, paragraph: p, strong } = builders(mySchema);
```

::: tip Keep one set of builders
Both the document you pass to the tester and the one you pass to
`toEqualProseMirrorNode` must come from the **same schema instance** — the
matcher checks schema identity and fails if they differ, even when the documents
look identical. Building both from one shared `builders(...)` call is the
simplest way to guarantee that.
:::

### Selection tags

The real advantage of the builder is inline **tags** — `<name>` markers you
place directly in the text to record positions. They are stripped from the
document but remembered, so you can point `setSelection` at them by name instead
of counting characters:

```ts
const document = doc(p("some<a>where<b>"));
// "a" is the position before "where", "b" the position after it.
```

Two names are conventional: `<cursor>` for a single caret position, and
`<a>` / `<b>` for the two ends of a range (the builder's defaults). You are free
to use any names you like — `<selStart>`, `<here>` — and refer to them the same
way.

## The tester

`ProseMirrorTester` mounts a real `EditorView` on the document you give it:

```ts
import { ProseMirrorTester } from "vitest-prosemirror";

const editor = new ProseMirrorTester(document, options);
```

The second argument is the same set of
[`EditorProps`](https://prosemirror.net/docs/ref/#view.EditorProps) you would
pass to a production `EditorView` — `plugins`, `nodeViews`, `attributes`,
`handleDOMEvents`, and so on — so your test configures the editor exactly as your
app does. Two props are managed by the tester and can't be passed (`state` and
`dispatchTransaction`), and one extra flag (`autoCleanup`) is added. See
[Options](/guide/api#options) for the full list.

```ts
import { keymap } from "prosemirror-keymap";
import { baseKeymap } from "prosemirror-commands";

const editor = new ProseMirrorTester(doc(p("Line one<cursor>")), {
  plugins: [keymap(baseKeymap)],
});
```

Once constructed, read the editor back through its getters — `doc` for the
current document, `state` for the full `EditorState`, and `html` / `text` for the
rendered DOM. `EditorState` is immutable and every action replaces it, so read
these *after* acting, never before.

### Cleanup

A mounted tester attaches a node to `document.body` and installs some global
mocks, so it has to be torn down between tests. You don't have to do this
yourself: loading `vitest-prosemirror/setup` (via
[`setupFiles`](/guide/getting-started#installation)) registers an `afterEach`
hook that destroys every tester automatically.

The one case that needs care is a tester you deliberately keep alive across
tests — for example one built once in `beforeAll`. Opt it out of the automatic
teardown so the `afterEach` doesn't destroy it after the first test, and tear it
down yourself:

```ts
let editor: ProseMirrorTester;

beforeAll(() => {
  editor = new ProseMirrorTester(doc(p("shared")), { autoCleanup: false });
});

afterAll(() => {
  editor.destroy();
});
```

## Describing selections

Most actions happen at the selection, so you'll set it constantly with
`setSelection`. It accepts a small vocabulary of `TesterSelection` forms, from
coarse to precise:

```ts
editor.setSelection("all"); // the whole document
editor.setSelection("start"); // caret at the very start
editor.setSelection("end"); // caret at the very end
editor.setSelection(4); // caret at position 4
editor.setSelection({ anchor: 4, head: 7 }); // a range from 4 to 7
```

`anchor` is the **fixed** end of a selection — where it began — and `head` is the
**moving** end, where the caret sits. Extend a selection (drag, or hold Shift and
press an arrow) and the anchor stays put while the head moves. A collapsed
selection — a plain caret — has both at the same position. The two are
directional, not a plain "from/to" range: the head may sit *before* the anchor (a
backwards selection), and it's the head that caret-sensitive plugins read. Content
operations still use the derived low/high positions, so `{ anchor: 7, head: 4 }`
and `{ anchor: 4, head: 7 }` cover the same text but point opposite ways.

Anywhere a position number is accepted — the bare form or either side of
`{ anchor, head }` — you can use a **tag name** instead, which is where the
builder tags pay off:

```ts
const editor = new ProseMirrorTester(doc(p("some<a>where<b>")));

editor.setSelection({ anchor: "a", head: "b" }); // select "where"
editor.setSelection("a"); // just move the caret to the "a" tag
```

You can also hand it a ready-made ProseMirror
[`Selection`](https://prosemirror.net/docs/ref/#state.Selection) when you need a
kind the shorthands don't cover — a
[`NodeSelection`](https://prosemirror.net/docs/ref/#state.NodeSelection) is the
common one:

```ts
import { NodeSelection } from "prosemirror-state";

editor.setSelection(NodeSelection.create(editor.doc, pos));
```

The trap worth remembering: `NodeSelection.create` takes the position **directly
before** the node, not inside it. (Cell selections work the same way, via
`prosemirror-tables` in your own test.)

See the [selections reference](/guide/api#selections) for the complete table of
forms.

## Putting it together

Arrange a document, act on the editor, assert on the document — the whole loop:

```ts
import { keymap } from "prosemirror-keymap";
import { baseKeymap } from "prosemirror-commands";
import { doc, p } from "prosemirror-test-builder";
import { ProseMirrorTester } from "vitest-prosemirror";
import { expect, test } from "vitest";

test("Enter splits the paragraph at the caret", () => {
  // Arrange
  const editor = new ProseMirrorTester(doc(p("one<cursor>two")), {
    plugins: [keymap(baseKeymap)],
  });
  editor.setSelection("cursor");

  // Act
  editor.type("{Enter}");

  // Assert
  expect(editor.doc).toEqualProseMirrorNode(doc(p("one"), p("two")));
});
```

## Next steps

- [Simulating input](/guide/simulating-input) — the full `type` key syntax,
  running commands, and the clipboard.
- [API reference](/guide/api) — every method, option and matcher in one place.
