# Simulating input

Once a [tester is set up](/guide/writing-a-test), you drive it the way a user
would: by typing, running the commands your keymap runs, and using the clipboard.
This page covers all three.

## Typing

`type` types into the editor at the current selection. Plain text is typed
character by character:

```ts
editor.type("Hello world");
```

Each character dispatches a real `keydown` → `keypress` → `keyup` sequence and
makes the DOM edit a browser would, which ProseMirror reads back through its own
input path — so input rules, `handleTextInput` and the rest fire exactly as in
the browser.

### Special keys

Keys that aren't a literal character go in a group, named by the key. A group can
be delimited with braces `{…}` or square brackets `[…]` — the parser treats the
two the same, so use whichever reads best:

```ts
editor.type("Hello{Enter}world");
editor.type("typo{Backspace}");
editor.type("{ArrowLeft}{ArrowLeft}");
```

The one special form is a `Key<Letter>` group, which resolves to that letter —
`{KeyA}` and `[KeyA]` both produce `a`, after the DOM `code` for that physical
key. It's conventionally written with brackets, but, like every group, either
delimiter works:

```ts
editor.type("[KeyH][KeyI]"); // types "hi"
```

Groups and text can be mixed freely in one call, and a group can follow plain
text with no separator:

```ts
editor.type("first line{Enter}second line");
```

To type a literal delimiter, double the opener — a pair of `{` yields one `{`, and
a pair of `[` yields one `[`:

```ts
editor.type("{{"); // types a single {
editor.type("[["); // types a single [
```

### Modifiers and chords

Combine a key with modifiers using `-`, just like a `prosemirror-keymap` binding:

```ts
editor.type("{Mod-b}bold{Mod-b} not bold");
editor.type("{Shift-ArrowRight}"); // extend the selection one grapheme
```

The modifier names match prosemirror-keymap: `Shift`, `Ctrl` (or `Control`),
`Alt`, `Meta` (or `Cmd`), and `Mod`. Because jsdom reports no platform, **`Mod`
resolves to `Ctrl`** (it would be `Meta` on macOS). A trailing `-` is the literal
minus key, so `{Mod--}` is Ctrl-minus.

A modifier on its own is a no-op — `{Shift}` presses and releases Shift without
typing anything — which is occasionally useful for exercising a plugin that keys
off `shiftKey`.

::: warning No hold or repeat syntax
The testing-library extensions for holding a key down (`{/Shift}`) or repeating
one (`{a>5}`) are not supported and throw. Press each key with its own token
instead.
:::

### What a key actually does

This is the part worth understanding, because it explains both why `{Enter}`
works in one test and throws in another.

Every key's `keydown` fires **through your plugins and keymaps first**. If a
handler takes it — a keymap binding, an input rule, ProseMirror's own key
handling — that handler's transaction is what changes the document, and the
tester does nothing further.

Only when **no** handler claims the keydown does the tester fall back to what a
browser would natively do:

| Key(s)                              | Native effect                                      |
| ----------------------------------- | -------------------------------------------------- |
| a printable character               | insert that character                              |
| `Backspace` / `Delete`              | delete before / after the caret                    |
| `ArrowLeft` / `ArrowRight`          | move the caret one grapheme                        |
| `Shift-ArrowLeft` / `Shift-ArrowRight` | extend the selection one grapheme               |
| `Shift`, `Ctrl`, `Alt`, `Meta`, `CapsLock`, `Tab` | ignored (no-op)                     |

Horizontal motion steps by a whole **grapheme cluster**, not a UTF-16 code unit —
so one press moves past an entire emoji, a base character plus its combining
marks, or a ZWJ sequence, just as a real caret does.

So `{Enter}` only splits a paragraph if a keymap binds `Enter` (for example
`baseKeymap`). With no such binding there is nothing native for the tester to do,
and rather than silently type the word "Enter" into your document, it throws
`Cannot simulate the "Enter" key`.

The same throw guards keys that jsdom genuinely can't reproduce, because they
depend on layout the headless DOM doesn't have:

- **Vertical motion** (`ArrowUp` / `ArrowDown`) picks its target from the caret's
  on-screen x-coordinate.
- **Word and line motion** (`Ctrl`/`Alt`/`Meta` with an arrow) has
  browser- and OS-specific boundaries.
- **`Home` / `End` / `PageUp` / `PageDown`** likewise need real geometry.

When you hit one of these, drive the behaviour a different way — bind it to a
command and test that (see below), or set the selection directly with
[`selectText`](/guide/writing-a-test#describing-selections).

## Input rules

Because `type` synthesises the DOM edit and lets ProseMirror read it back
through its own input path, [input rules](https://prosemirror.net/docs/ref/#inputrules)
fire as you type: typing a rule's trigger runs the rule, exactly as it would in
the browser.

Configure them the way your app does — as an `inputRules` plugin — then type the
trigger:

```ts
import { InputRule, inputRules } from "prosemirror-inputrules";
import { schema } from "prosemirror-schema-basic";
import { builders } from "prosemirror-test-builder";
import { ProseMirrorTester } from "vitest-prosemirror";
import { expect, test } from "vitest";

const { doc, paragraph: p } = builders(schema);

test("typing !! runs the input rule", () => {
  const editor = new ProseMirrorTester(doc(p("Hello World<cursor>")), {
    plugins: [
      inputRules({
        rules: [
          new InputRule(/!!/u, (state, _match, start, end) =>
            state.tr.replaceWith(start, end, schema.text("‼")),
          ),
        ],
      }),
    ],
  });

  editor.selectText("cursor");
  editor.type("!!");

  expect(editor.doc).toEqualProseMirrorNode(doc(p("Hello World‼")));
});
```

Typing only part of the trigger (`!`) leaves the document untouched, and a
character typed after the match (`!!x`) still fires the rule then inserts the
character — the same partial-match behaviour a user sees.

::: tip Pass input rules as a plugin, not an option
There is deliberately no shortcut option for input rules — you pass them as a
plugin, as above. Where the `inputRules` plugin sits in the array decides its
`handleTextInput` precedence, and `undoInputRule` needs a matching keymap
binding, so an option that appended the plugin for you would make an invisible
ordering decision. Passing the plugin yourself keeps the test faithful to how
your editor is really configured.
:::

## Running commands

Sometimes you want to test a ProseMirror
[`Command`](https://prosemirror.net/docs/ref/#state.Command) directly, without
routing it through a keybinding. `command` runs one against the current state and
returns whether it applied:

```ts
import { toggleMark } from "prosemirror-commands";

editor.selectText({ anchor: "a", head: "b" });
const applied = editor.command(toggleMark(schema.marks.strong));

expect(applied).toBe(true);
```

This is the most direct way to unit-test a command. To test the *binding* — that
pressing a key runs the command — pass the keymap as a plugin and type the chord
instead:

```ts
import { keymap } from "prosemirror-keymap";

const editor = new ProseMirrorTester(doc(p("<a>some text<b>")), {
  plugins: [keymap({ "Mod-b": toggleMark(schema.marks.strong) })],
});

editor.selectText({ anchor: "a", head: "b" });
editor.type("{Mod-b}");

expect(editor.doc).toEqualProseMirrorNode(doc(p(strong("some text"))));
```

## Clipboard

`paste` and `copy` go through the editor's real clipboard path, so app
`handlePaste` handlers, `transformPasted*` hooks and the clipboard parsers all
run.

### Pasting

`paste` dispatches a real `paste` event. Its argument can be a plain string
(pasted as `text/plain`), a ProseMirror `Node` (serialized to clipboard HTML and
text), or an object describing the clipboard contents:

```ts
editor.paste("just text");
editor.paste(p("a ", strong("rich"), " paragraph"));
editor.paste({ html: "<p>from <em>HTML</em></p>" });
```

Two fields of the object form are worth knowing:

- **`plainText: true`** forces the plain-text paste path, as if the user held
  Shift while pasting — useful for testing that your editor strips formatting.
- **`files`** carries pasted images as real `File`s, which reach a `handlePaste`
  handler reading `event.clipboardData.files`:

```ts
editor.paste({ files: [new File([bytes], "cat.png", { type: "image/png" })] });
```

### Copying

`copy` serializes the current selection exactly as the real copy handler would,
returning `{ html, text }`:

```ts
editor.selectText("all");
const clipboard = editor.copy();
```

Because a `copy` result is a valid `paste` argument, the two round-trip — handy
for asserting that copying and pasting a slice reproduces it:

```ts
const clipboard = source.copy();
target.paste(clipboard);
```

## Next steps

- [Writing a test](/guide/writing-a-test) — building documents, the tester
  lifecycle and describing selections.
- [API reference](/guide/api) — every method, option and matcher in one place.
