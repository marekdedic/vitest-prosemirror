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
