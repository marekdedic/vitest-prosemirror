# AGENTS.md

This file provides guidance to coding agents when working with code in this repository.

## Commands

- `npm run build` — Vite library build into `dist/` (cleans first). `npm start` is the same with `--watch`.
- `npm run lint` — runs `lint:eslint` (ESLint, incl. Prettier, package.json and Markdown linting) and the `lint:ts` group — `lint:ts:typecheck` (`tsc --noEmit`) and `lint:ts:attw` (`attw --pack`, validates the published type entrypoint) — in parallel.
- `npm test` — single-pass run with V8 coverage (what CI runs). Codecov requires ≥90% patch coverage, so new code needs tests. Single file: `npx vitest run tests/typing/insertText.test.ts`; single case: `npx vitest run -t "name of test"`. `npm run test-watch` — Vitest in watch mode for the dev loop.

There is no separate typecheck script; type errors surface via ESLint (typed linting) and the build's `unplugin-dts` step.

## Architecture

A Vitest plugin that lets tests drive a real ProseMirror `EditorView` inside jsdom.

- `src/index.ts` — entrypoint. Side-effectfully calls `expect.extend` to register the `toEqualProseMirrorNode` matcher and augments the `vitest` module's `Assertion` interfaces. Because of this, the package is `sideEffects: true` and the built `.d.ts` gets `import 'vitest';` prepended by the `pure-import-fixer` plugin in `vite.config.ts` — without that, the module augmentation is dropped. It also re-exports the public API, whose types live next to the code that consumes them rather than in a shared types file.
- `src/ProseMirrorTester.ts` — the public class and its `Options`. Deliberately thin: it constructs an `EditorView` mounted on a real jsdom element, installs the mocks below, and delegates `insertText` to `src/typing/` and `selectText` to `src/selection.ts`. The `view` itself stays private; reading is exposed through getters — `state` (the primary interface, a live getter since `EditorState` is immutable and `view.state` is replaced on every dispatch — handing out reading, not mutation), `doc` (convenience for `state.doc`), and `html`/`text` (`view.dom.innerHTML`/`textContent`, the *rendered* DOM, distinct from `doc.textContent`). There is deliberately no mutable `dom` accessor: `MutationObserver` is a mock, so mutating `view.dom` directly would desync `docView` and corrupt later `insertText` position arithmetic.
- `src/typing/` — the `insertText` pipeline. A folder means "a multi-file subsystem"; this is the only one. Everything else lives flat in `src/`.
  - `src/typing/typing.ts` — `insertText` and the event orchestration. Dispatches keydown/keypress/keyup, and on a keydown that wasn't `preventDefault()`ed (i.e. no keymap, plugin or ProseMirror's own `captureKeyDown` handled it) decides via `keyAction` what a browser would do, then calls the `domEditing` effects: types a character, deletes for Backspace/Delete, moves the caret one position for unmodified ArrowLeft/ArrowRight, ignores Tab and the modifier keys (a browser handles those outside the document). Any other named key throws, because typing its name into the document silently corrupts the test.
  - `src/typing/domEditing.ts` — the view-mutating effects `typeCharacter`/`deleteText`/`moveCaret`: they edit the DOM the way a browser would (typing into the text node `view.domAtPos(pos, -1)` resolves to, or a new one created at that DOM position when the caret sits between nodes holding no text; deleting by the mirror-image edit) and report the mutation via `MutationObserverMock` rather than dispatching a transaction — this exercises ProseMirror's real input path.
  - `src/typing/keyboardInput.ts` — `tokenizeKeyboardInput` parses testing-library-style key strings (`{Enter}`, `[KeyA]`) into a token list, throwing on unsupported syntax (`/` prefix for hold, `>` for repeats).
  - `src/typing/keyChord.ts` — `parseKeyChord` splits prosemirror-keymap chord syntax (`Mod-b`) into a key plus `KeyboardModifiers` (defined here, where the modifiers are constructed).
  - `src/typing/keyIdentity.ts` — maps a token to the `key`/`code`/`keyCode`/`charCode`/`location` a browser would report (legacy `keyCode`s follow Chromium's tables).
  - `src/typing/dom.ts` — `characterDataAt`, which turns a DOM position (node plus child index, as `view.domAtPos` returns it) into the text node `domEditing.ts` writes the typed character into or deletes from — the one the position is inside, or its nearest neighbour on either side. Null means the caret sits between nodes holding no text, where typing creates a text node and deleting throws.
- `src/MutationObserverMock.ts` — replaces `global.MutationObserver` and lets `domEditing.ts` synthesise the exact mutation records ProseMirror's DOM observer expects. It `implements MutationObserver` rather than extending it, so importing the module doesn't require the global to exist.
- `src/mockRangeRects.ts` — jsdom has no rects for a `Range`; zero-sized rects keep ProseMirror's cursor-motion measurements inconclusive, which it handles gracefully.
- `src/selection.ts` — the flexible `TesterSelection` (`"all" | "start" | "end" | number | { anchor, head } | Selection`) and `resolveSelection`, which turns it into a ProseMirror `Selection`. The removed `{ from, to }` form throws with a migration message.
- `src/stringifyProseMirrorNode.ts` — renders a doc as prosemirror-test-builder-like source (`paragraph(strong('x'))`), using each node's real schema type name so the output matches `builders(schema)` source 1:1 (no type renaming). Text is escaped for single-quote embedding (`escapeText`), and every node — not just text — is wrapped in its marks (`wrapMarks`), mirroring prosemirror-model's own debug serialiser. The matcher compares these strings, so **the diff quality of failing assertions depends entirely on this serialisation** — nodes whose distinguishing state isn't stringified will compare equal. Schema identity is not encoded here; the matcher checks it out of band (`received.type.schema === expected.type.schema`), since a schema has no stable serialisable identity.

## Conventions

- ESM only, `type: "module"`; no default exports; arrow functions preferred (`eslint-plugin-prefer-arrow-functions`); imports/keys/members sorted by `eslint-plugin-perfectionist` — run lint rather than hand-ordering.
- Any `eslint-disable` needs a `--` justification comment (enforced by `@eslint-community/eslint-comments`).
- ProseMirror packages, `stringify-object` and `vitest` are externals in the build; `vitest` is an optional peer dep spanning v2–v4, and CI tests against all three, so avoid version-specific Vitest APIs.
