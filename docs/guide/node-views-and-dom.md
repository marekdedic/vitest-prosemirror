# Node views & the DOM

Most tests assert on the document. But some behaviour lives in the **rendered
DOM** — a [node view](https://prosemirror.net/docs/ref/#view.NodeView) with its
own widgets, a `handleDOMEvents` handler, an element whose class or attribute
reflects state. This page is about inspecting and interacting with that rendered
output.

The tester keeps the underlying `EditorView` private on purpose — mutating its
DOM directly would desync ProseMirror's view of the document. Instead it exposes
a small, safe surface: getters that read the DOM, and helpers that query and
click it.

## Reading the rendered DOM

Two getters return what the editor actually rendered:

```ts
editor.html; // view.dom.innerHTML — the rendered markup
editor.text; // view.dom.textContent — the rendered text
```

Keep the distinction between **rendered** and **model** text in mind:

- `editor.text` is what the DOM shows — including anything a node view or
  decoration adds that isn't in the document.
- `editor.doc.textContent` is the text of the document model.

They usually agree, but when a node view renders extra chrome, or a widget
decoration injects text, they diverge — and which one you assert on depends on
what you're testing.

## Querying elements

`element` and `elements` run a CSS selector against the editor's DOM:

```ts
const box = editor.element('input[type="checkbox"]'); // first match
const boxes = editor.elements('input[type="checkbox"]'); // all matches
```

They differ in how they report a miss, which shapes how you assert:

- `element` returns a single `HTMLElement` and **throws** — naming the selector —
  when nothing matches, so a missing element fails the test loudly at the point
  of the query.
- `elements` returns an array (empty when nothing matches), so absence is just a
  `length` of `0` you can assert on.

```ts
expect(editor.elements("span.missing")).toHaveLength(0);
```

## Clicking

`click` dispatches a real, bubbling `MouseEvent`. It reaches a node view's own
event listeners and the editor's `handleDOMEvents`, and returns whether the
default was prevented:

```ts
const prevented = editor.click('input[type="checkbox"]');
```

The target can be a selector (resolved like `element`) or an `Element` you
captured earlier. Capturing the element first is what lets you click a node view
*after* its node is gone — exercising the `getPos() === undefined` path that
real node views must guard:

```ts
const box = editor.elements('input[type="checkbox"]')[0];

// delete the node the checkbox belongs to
editor.command((state, dispatch) => {
  dispatch?.(state.tr.delete(0, state.doc.child(0).nodeSize));
  return true;
});

editor.click(box); // the element is detached; the guard should make this a no-op
```

::: warning `click` and `handleClick`
`click` **throws** if the editor configures any of `handleClick`,
`handleClickOn`, `handleDoubleClick*` or `handleTripleClick*`. Those props run
only after ProseMirror resolves the click to a document position, and a headless
DOM has no layout — `posAtCoords` is always `null`, so ProseMirror's `mousedown` handler
bails before reaching them. A click routed through them would be a silent no-op,
so the tester refuses rather than let you write a test that passes for the wrong
reason. Put the behaviour on the node view's own element (as below) and click
that instead.
:::

## A worked node-view test

Here's the whole loop against a todo-item node view whose checkbox toggles a
`checked` attribute. The node view puts the click listener on its own
`<input>` — exactly the pattern that works with `click`:

```ts
import { renderProseMirror } from "vitest-prosemirror";
import { expect, test } from "vitest";

// A `todo` node with a `checked` attribute, rendered by TodoView below.
// (schema and TodoView omitted for brevity — TodoView's <input> carries a
// click listener that dispatches a setNodeAttribute transaction.)

test("clicking the second checkbox toggles only the second item", () => {
  const editor = renderProseMirror(makeDoc(), {
    editorProps: { nodeViews: { todo } },
  });

  const boxes = editor.elements('input[type="checkbox"]');
  editor.click(boxes[1]);

  expect(editor.doc.child(0).attrs.checked).toBe(false);
  expect(editor.doc.child(1).attrs.checked).toBe(true);
});
```

Because the click goes through the real DOM, the node view's listener runs, its
transaction dispatches, and the assertion reads the resulting document — the same
sequence that happens when a user clicks in the browser.

You can assert on `handleDOMEvents` the same way: configure a `click` handler in
the tester options, click an element, and check the handler ran.

::: tip Node views from a plugin
The `nodeViews` option is the direct way in, but node views are also just an
`EditorProps` entry — so a plugin that supplies them through its own `props`
works too, and is how many real editors register them:

```ts
renderProseMirror(doc, {
  editorProps: {
    plugins: [new Plugin({ props: { nodeViews: { todo } } })],
  },
});
```

Either way ProseMirror builds the views itself, giving them the real `update()` /
`destroy()` lifecycle and a real `getPos`. Configuring them exactly as your app
does keeps the test honest.
:::

## Next steps

- [Simulating input](/guide/simulating-input) — typing, commands and the
  clipboard.
- [API reference](/guide/api) — every getter and method, including the matchers
  you'll assert with.
