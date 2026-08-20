# AGENTS.md

This file provides guidance to coding agents when working with code in this repository.

## Commands

- `npm run build` — Vite library build into `dist/` (cleans first). `npm start` is the same with `--watch`.
- `npm run lint` — runs `lint:eslint` (ESLint, incl. Prettier, package.json and Markdown linting) and `lint:attw` (`attw --pack`, validates the published type entrypoint) in parallel.
- `npm test` — Vitest in watch mode. Single file: `npx vitest run tests/ProseMirrorTester.test.ts`; single case: `npx vitest run -t "name of test"`.
- `npm run test-coverage` — single-pass run with V8 coverage (what CI runs). Codecov requires ≥90% patch coverage, so new code needs tests.

There is no separate typecheck script; type errors surface via ESLint (typed linting) and the build's `unplugin-dts` step.

## Architecture

A Vitest plugin that lets tests drive a real ProseMirror `EditorView` inside jsdom.

- `src/index.ts` — entrypoint. Side-effectfully calls `expect.extend` to register the `toEqualProseMirrorNode` matcher and augments the `vitest` module's `Assertion` interfaces. Because of this, the package is `sideEffects: true` and the built `.d.ts` gets `import 'vitest';` prepended by the `pure-import-fixer` plugin in `vite.config.ts` — without that, the module augmentation is dropped.
- `src/ProseMirrorTester.ts` — the core. It constructs an `EditorView` mounted on a real jsdom element, and fakes the browser behaviour ProseMirror relies on but jsdom lacks:
  - `MutationObserverMock` replaces `global.MutationObserver` and lets `insertText` synthesise the exact mutation records ProseMirror's DOM observer expects. This is why `insertText` manually edits the DOM (text node insertion, or replacing the `ProseMirror-trailingBreak` `<br>`) and then reports the mutation, rather than dispatching a transaction — it exercises ProseMirror's real input path.
  - `KeyboardEventMock` reports `preventDefault()` so `insertText` can skip synthetic typing when a keymap/plugin handled the keydown.
  - `selectText` accepts a flexible `TesterSelection` (`"all" | "start" | "end" | number | {from,to} | Selection`).
- `src/utils/keyboardInput.ts` — parses testing-library-style key strings (`{Enter}`, `[KeyA]`) into a token list, throwing on unsupported syntax (`/` prefix for hold, `>` for repeats).
- `src/stringifyProseMirrorNode.ts` — renders a doc as prosemirror-test-builder-like source (`p(strong('x'))`), with a `renamedTypes` map (paragraph→p, heading→h, …). The matcher compares these strings, so **the diff quality of failing assertions depends entirely on this serialisation** — nodes whose distinguishing state isn't stringified will compare equal.

## Conventions

- ESM only, `type: "module"`; no default exports; arrow functions preferred (`eslint-plugin-prefer-arrow-functions`); imports/keys/members sorted by `eslint-plugin-perfectionist` — run lint rather than hand-ordering.
- Any `eslint-disable` needs a `--` justification comment (enforced by `@eslint-community/eslint-comments`).
- ProseMirror packages, `stringify-object` and `vitest` are externals in the build; `vitest` is an optional peer dep spanning v2–v4, and CI tests against all three, so avoid version-specific Vitest APIs.
