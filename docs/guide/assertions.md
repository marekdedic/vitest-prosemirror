# Assertions & snapshots

Driving the editor is only half a test — the other half is asserting on the
result. `vitest-prosemirror` adds two custom matchers and two snapshot
serializers, all registered automatically when you import the package from a
[setup file](/guide/getting-started#installation).

They share one idea: a ProseMirror document is compared and displayed as
**`prosemirror-test-builder` source** (`doc(paragraph('hi'))`), not as raw
internals. So a failing assertion reads like the code you wrote, and the diff
points at the node that differs.

## `toEqualProseMirrorNode`

The workhorse. It asserts that two documents are structurally equal:

```ts
editor.type("Hello world");

expect(editor.doc).toEqualProseMirrorNode(doc(p("Hello world")));
```

Under the hood it serializes both documents to builder source and compares the
strings, so a mismatch shows a readable, code-shaped diff.

::: tip Your assertions are only as good as the serialization
Two documents compare **equal** when they stringify identically. Any state that
isn't rendered into that string — a custom attribute the serializer doesn't
print, for instance — won't be compared. If a node type carries distinguishing
state, give it a
[`toDebugString`](https://prosemirror.net/docs/ref/#model.NodeSpec.toDebugString)
so it appears in the comparison (and in every failure diff).
:::

### Schema identity

The matcher also checks that both documents come from the **same schema
instance**. Two documents that stringify identically but were built from
different schemas fail, with a message that says exactly that:

```text
The documents stringify identically but come from different schemas
```

This is the most common surprise when your expected document is built from a
freshly-created schema rather than the one the tester uses. Build both from a
single shared set of builders (see
[Building documents](/guide/writing-a-test#building-documents)) and they'll match.

## `toHaveSelection`

Asserts on the current selection. The received value can be the tester itself or
an `EditorState`, and the expected value is any
[`TesterSelection`](/guide/writing-a-test#describing-selections):

```ts
editor.setSelection({ anchor: 4, head: 7 });

expect(editor).toHaveSelection({ anchor: 4, head: 7 });
expect(editor).toHaveSelection("all"); // fails — see below
```

A failure names the **kind** of each selection (`TextSelection`,
`AllSelection`, `NodeSelection`, …) alongside the diff:

```text
Expected selection to equal (AllSelection):
  …
Actual (TextSelection):
  …
```

That kind line matters because two different selection kinds can cover the same
span and render with identical markers — a `TextSelection` over the whole
document and an `AllSelection` look the same in the diff, so without the kind the
failure would look like it has no difference at all.

## Asserting other state

The matchers cover the **closed set** of editor state — the document and the
selection. Everything else you assert on directly, by reading it off
[`editor.state`](/guide/writing-a-test#the-tester).

Stored marks, for instance, have no dedicated matcher — a plain `toEqual` on the
short array is sufficient:

```ts
expect(editor.state.storedMarks).toEqual([schema.marks.strong.create()]);
```

The same goes for open-ended state a matcher can't know about — the value behind
your own plugin key, a decoration set, and so on:

```ts
expect(myPluginKey.getState(editor.state)).toEqual(/* … */);
```

## Snapshots

For cases where writing out the expected document by hand is tedious, snapshot
the node or the state directly. The serializers render the same builder-source
form, so snapshots stay human-readable and diff cleanly in review.

### Snapshotting a document

Passing a node to `toMatchSnapshot` (or `toMatchInlineSnapshot`) renders it as
builder source:

```ts
expect(editor.doc).toMatchInlineSnapshot(`
  doc(
    paragraph('Hello World!'),
  )
`);
```

### Snapshotting the state

Passing the tester or an `EditorState` captures the document **and** the
selection — and stored marks, when present. The selection appears both as inline
markers in the document (`<cursor>` for a caret, `<anchor>` / `<head>` for a
range) and as a trailing summary line naming its kind and range:

```ts
editor.setSelection({ anchor: 4, head: 7 });

expect(editor.state).toMatchInlineSnapshot(`
  doc(
    paragraph('foo<anchor>bar<head>'),
  )
  # selection: TextSelection 4..7
`);
```

A collapsed selection renders a single `<cursor>` marker; a selection whose ends
sit between nodes (an `AllSelection`, a `NodeSelection`) places the markers on
their own lines. When the state carries stored marks, a `# storedMarks:` line
follows:

```ts
expect(editor.state).toMatchInlineSnapshot(`
  doc(
    paragraph('foo<cursor>bar'),
  )
  # selection: TextSelection 4..4
  # storedMarks: [strong]
`);
```

Snapshotting the state is the quickest way to pin down a test that cares about
both the document and where the selection ended up — after a command, a paste, or
a run of typing.

## Next steps

- [API reference](/guide/api) — the matchers and every other part of the surface
  in one place.
- [Writing a test](/guide/writing-a-test) — building the documents you assert
  against.
