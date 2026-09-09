# Migration to 1.0

The 1.0 release changes the public API. It contains breaking changes, each with
a mechanical migration. This page lists them.

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
