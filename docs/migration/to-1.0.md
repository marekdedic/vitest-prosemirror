# Migration to 1.0

The 1.0 release changes the public API. It contains breaking changes, each with
a mechanical migration. This page lists them.

## `new ProseMirrorTester(...)` is now `renderProseMirror(...)`

The `ProseMirrorTester` class and its `new` constructor have been replaced by a
`renderProseMirror` factory function, matching the verb-named `render` idiom of
Testing Library and jest-prosemirror's `createEditor`. It returns a
`ProseMirrorEditor` — an interface, so the public contract is decoupled from the
implementation class, which is now internal.

```ts
// before
import { ProseMirrorTester } from "vitest-prosemirror";

const editor = new ProseMirrorTester(doc(p("Hello<cursor>")));

// after
import { renderProseMirror } from "vitest-prosemirror";

const editor = renderProseMirror(doc(p("Hello<cursor>")));
```

The document argument and returned editor are unchanged, and the automatic
`afterEach` teardown behaves exactly as before. The options object is
restructured — see [_`EditorProps` now nest under `editorProps`_](#editorprops-now-nest-under-editorprops)
below. Where you referenced the `ProseMirrorTester` type (e.g. a helper's return
type), use `ProseMirrorEditor` instead:

```ts
// codemod-friendly find & replace
- new ProseMirrorTester(
+ renderProseMirror(
```

## `EditorProps` now nest under `editorProps`

The `EditorProps` passed to the underlying `EditorView` (`plugins`, `nodeViews`,
`editable`, `attributes`, `handleDOMEvents`, and so on) used to sit at the top
level of the options object, mixed in with the tester's own `autoCleanup` flag.
They now live under a dedicated `editorProps` key, cleanly separated from the
tester options.

```ts
// before
renderProseMirror(doc(p("Hello<cursor>")), {
  plugins: [keymap(baseKeymap)],
  nodeViews: { todo },
  autoCleanup: false,
});

// after
renderProseMirror(doc(p("Hello<cursor>")), {
  editorProps: {
    plugins: [keymap(baseKeymap)],
    nodeViews: { todo },
  },
  autoCleanup: false,
});
```

`autoCleanup` stays at the top level; every other option moves inside
`editorProps`. Its behaviour, including that `plugins` is routed into
`EditorState.create`, is otherwise unchanged.

## `insertText` is now `type`

The tester method `insertText` has been renamed to `type`.

```ts
// before
editor.insertText(" world");
editor.insertText("{Enter}");

// after
editor.type(" world");
editor.type("{Enter}");
```

The behaviour is unchanged — only the name is different.

The fix is a rename at every call site; there is no change to the arguments:

```ts
// codemod-friendly find & replace
- editor.insertText(
+ editor.type(
```

## `selectText` is now `setSelection`

The tester method `selectText` has been renamed to `setSelection`.

```ts
// before
editor.selectText("end");
editor.selectText({ anchor: "a", head: "b" });

// after
editor.setSelection("end");
editor.setSelection({ anchor: "a", head: "b" });
```

The behaviour is unchanged — only the name is different.

The fix is a rename at every call site; there is no change to the arguments:

```ts
// codemod-friendly find & replace
- editor.selectText(
+ editor.setSelection(
```

## `setSelection`'s `{ from, to }` is now `{ anchor, head }`

The object form of `setSelection` has been renamed from `{ from, to }` to
`{ anchor, head }`.

```ts
// before
editor.setSelection({ from: 3, to: 7 });

// after
editor.setSelection({ anchor: 3, head: 7 });
```

The behaviour is unchanged — the values already mapped straight to a selection's
anchor and head, so `{ from: a, to: b }` becomes `{ anchor: a, head: b }` with the
same result, direction included. The new names match ProseMirror's own
`Selection` vocabulary.
