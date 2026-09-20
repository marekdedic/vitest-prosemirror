# Testing parse rules

A schema's [`parseDOM`](https://prosemirror.net/docs/ref/#model.NodeSpec.parseDOM)
rules decide how HTML becomes editor content — they run whenever the editor
loads HTML or the user pastes. `parseHTML` lets you test those rules on their own,
turning an HTML string into a document with **no tester and no `EditorView`
involved**:

```ts
import { parseHTML } from "vitest-prosemirror";

const node = parseHTML("<p>hello</p>", schema);

expect(node).toEqualProseMirrorNode(doc(p("hello")));
```

It parses `html` against the given `schema` (via `DOMParser.fromSchema`) and
returns the resulting node — the same [`toEqualProseMirrorNode`](/guide/assertions)
matcher applies. Use it to assert that a given fragment of HTML produces exactly
the nodes, attributes and marks your `parseDOM` rules intend.

## Why not just `innerHTML`?

Reading HTML into a node yourself — assigning to a detached element's
`innerHTML` and parsing that — is silently lossy for **table-related elements**.
The HTML parser only keeps `<td>`, `<tr>`, `<thead>`, `<caption>` and friends
inside a real `<table>` ancestor, so a bare `<td>…</td>` collapses to just its
text before your rule ever sees it.

`parseHTML` reproduces prosemirror-view's own wrap-parse-unwrap: it wraps the
fragment in the table ancestors it needs, parses, then unwraps — so a lone cell
parses the same way here as it would on a real paste:

```ts
// A rule on the `tableCell` node reads a `data-align` attribute.
expect(
  parseHTML('<td data-align="right">hi</td>', schema),
).toEqualProseMirrorNode(
  doc(table(tableRow(tableCell({ align: "right" }, "hi")))),
);
```

## Options

The third argument is prosemirror-model's own
[`ParseOptions`](https://prosemirror.net/docs/ref/#model.ParseOptions), passed
straight through. The two you'll reach for most:

- **`topNode`** — parse the fragment as the content of a specific node rather than
  the schema's default top node, handy when a rule only makes sense inside a
  particular parent:

  ```ts
  parseHTML("hi", schema, {
    topNode: schema.nodes.tableCell.create({ align: "left" }),
  });
  ```

- **`preserveWhitespace`** — keep runs of whitespace instead of collapsing them,
  when that distinction is what you're testing.

## Relationship to `paste`

The rules `parseHTML` exercises are the same ones the real
[paste path](/guide/simulating-input#clipboard) runs. Reach for `paste` when you
want the whole flow — `handlePaste`, `transformPasted*`, the resulting
transaction — and for `parseHTML` when you want to pin down a single `parseDOM`
rule in isolation, without mounting an editor.

## Next steps

- [API reference](/guide/api#parsehtml) — the exact signature.
- [Simulating input](/guide/simulating-input#clipboard) — testing the full paste
  path through a tester.
