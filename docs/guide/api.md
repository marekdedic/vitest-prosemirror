# API reference

## `renderProseMirror`

The main entry point. Call it with the document you want to start from and,
optionally, the same editor props you would pass to a real `EditorView`. It
returns a `ProseMirrorEditor` handle for driving the editor.

```ts
import { renderProseMirror } from "vitest-prosemirror";

const editor = renderProseMirror(doc, options);
```

### Signature

```ts
renderProseMirror(documentRoot: Node, options?: Partial<Options>): ProseMirrorEditor
```

- `documentRoot` — the starting document, typically built with
  `prosemirror-test-builder`. Any selection tags (`<cursor>`, `<a>`, …) on it are
  recorded but do **not** set the initial selection — apply one with
  [`setSelection`](#selections) (e.g. `setSelection("cursor")`).
- `options` — `Options` (see below), all fields optional.

### Options

`Options` takes the editor props and tester configuration:

| Option        | Type          | Default | Description                                                                 |
| ------------- | ------------- | ------- | --------------------------------------------------------------------------- |
| `editorProps` | `EditorProps` | `{}`    | The props passed to the `EditorView`. See below.                            |
| `autoCleanup` | `boolean`     | `true`  | When `true`, the editor is destroyed automatically in an `afterEach` hook.  |

`editorProps` is every
[`EditorProps`](https://prosemirror.net/docs/ref/#view.EditorProps) an app can
pass to an `EditorView` — `nodeViews`, `markViews`, `editable`, `attributes`,
`handleDOMEvents`, the clipboard hooks, and so on — **except** `state` and
`dispatchTransaction`. Everything in it is spread straight into the `EditorView`
constructor, for full config parity with production, with one exception:
`plugins` is routed into `EditorState.create` (the only form in which plugin
state works).

```ts
renderProseMirror(doc(p("Line one<cursor>")), {
  autoCleanup: false,
  editorProps: {
    plugins: [keymap(baseKeymap)],
    nodeViews: { todo },
  },
});
```

`state` is excluded because it is built from the `documentRoot` argument.
`dispatchTransaction` is excluded on purpose: overriding it would replace the
view's default state handling and desync the synthesised DOM edits that
`type` relies on.

### Reading the editor

These getters expose the editor's state. The `view` itself stays private — there
is deliberately no mutable DOM accessor, since directly mutating the DOM would
desync ProseMirror's document view.

| Getter  | Type          | Description                                                                 |
| ------- | ------------- | --------------------------------------------------------------------------- |
| `state` | `EditorState` | The live editor state. Re-read after every action — `EditorState` is immutable. |
| `doc`   | `Node`        | Convenience for `state.doc`.                                                 |
| `html`  | `string`      | The rendered DOM (`view.dom.innerHTML`).                                     |
| `text`  | `string`      | The rendered text content (`view.dom.textContent`).                         |

### Methods

#### `type(text: string): void`

Types `text` into the editor at the current selection, driving ProseMirror's
real input path. Plain characters are typed literally; special keys and chords go
in `{…}` or `[…]` groups (`{Enter}`, `{Mod-b}`, `[KeyA]`).

```ts
editor.type("Hello{Enter}world");
```

See [Simulating input](/guide/simulating-input#typing) for the full key syntax
and which keys are supported.

#### `setSelection(selection: TesterSelection): void`

Sets the selection. See [selections](#selections) for the accepted forms.

#### `command(command: Command): boolean`

Runs a ProseMirror [`Command`](https://prosemirror.net/docs/ref/#state.Command)
against the current state, returning whether it applied.

```ts
import { toggleMark } from "prosemirror-commands";

editor.command(toggleMark(schema.marks.strong));
```

#### `paste(content: PasteInput): void`

Dispatches a real `paste` event through the DOM, running the full paste path
(`handlePaste`, `transformPasted*`, the clipboard parsers and the paste
transaction metadata).

`PasteInput` is one of three forms:

```ts
type PasteInput = string | Node | PasteContent;
```

- a `string` — pasted as `text/plain`;
- a ProseMirror `Node` — serialized to clipboard HTML and text, exactly as the
  copy handler would;
- a `PasteContent` object, which sets the clipboard flavours explicitly:

```ts
interface PasteContent {
  text?: string; // the text/plain flavour
  html?: string; // the text/html flavour
  files?: File[]; // pasted files such as images, as real File objects
  plainText?: boolean; // force the plain-text paste path, as if Shift were held
}
```

#### `copy(): Clipboard`

Serializes the current selection exactly as the real copy handler would,
returning `{ html, text }`. Its result feeds straight back into `paste()`.

#### `click(target: Element | string): boolean`

Dispatches a real bubbling `MouseEvent` at `target` (a CSS selector or a captured
`Element`), returning whether the default was prevented. Reaches node views' own
listeners and `handleDOMEvents`.

::: warning
`click` throws if any `handleClick*` / `handleDoubleClick*` / `handleTripleClick*`
prop is configured: a headless DOM has no layout, so `posAtCoords` is always null and
ProseMirror's `mousedown` handler bails before those props run.
:::

#### `element(selector: string): HTMLElement`

Returns the first element matching `selector` within the editor DOM, throwing
on a miss.

#### `elements(selector: string): HTMLElement[]`

Returns all matching elements — or an empty array when there are none.

#### `destroy(): void`

Tears the tester down. Called automatically when `autoCleanup` is `true`.

## Custom matchers

Registered on `expect` when `vitest-prosemirror/setup` is loaded (via
`setupFiles`). Because
these compare documents as `prosemirror-test-builder` source, failing assertions
produce readable, code-shaped diffs.

### `toEqualProseMirrorNode(expected: Node)`

Asserts two documents are structurally equal **and** share a schema.

```ts
expect(editor.doc).toEqualProseMirrorNode(doc(p("Hello world")));
```

### `toHaveSelection(expected: TesterSelection)`

Asserts the editor's selection matches. The received value may be an
`EditorState` or a `ProseMirrorEditor`.

```ts
expect(editor).toHaveSelection({ anchor: 1, head: 6 });
```

## Selections

A `TesterSelection` — accepted by `setSelection` and `toHaveSelection` — can be any
of:

| Form                          | Meaning                                                    |
| ----------------------------- | ---------------------------------------------------------- |
| `"all"`                       | Select the whole document.                                 |
| `"start"` / `"end"`           | An empty selection at the document start / end.            |
| `number`                      | An empty selection (cursor) at that position.              |
| `{ anchor, head }`            | A range; each side is a position `number`.                 |
| `Selection`                   | A ProseMirror `Selection`, used as-is.                     |

Anywhere a position `number` is accepted — a bare string, or either field of
`{ anchor, head }` — a `prosemirror-test-builder` `<name>` tag may stand in for
it, read off the document's tags:

```ts
const editor = renderProseMirror(doc(p("some<a>where<b>")));
editor.setSelection({ anchor: "a", head: "b" });
```

## `parseHTML`

A standalone, model-level helper (no tester or `EditorView` involved) for testing
a schema's `parseDOM` rules. See
[Testing parse rules](/guide/testing-parse-rules) for a walkthrough.

```ts
import { parseHTML } from "vitest-prosemirror";

const node = parseHTML(html, schema, options);
```

- `html` — the HTML string to parse.
- `schema` — the ProseMirror `Schema` to parse against.
- `options` — prosemirror-model's own
  [`ParseOptions`](https://prosemirror.net/docs/ref/#model.ParseOptions),
  passed straight through.

It reproduces prosemirror-view's wrap-parse-unwrap, so table-related elements
(`td`, `tr`, `thead`, …) parse identically here and on the real `paste()` path,
where a bare `innerHTML` assignment would silently drop them.
