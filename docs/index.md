---
layout: home

hero:
  name: vitest-prosemirror
  text: Test ProseMirror with Vitest
  tagline: Drive a real ProseMirror EditorView inside your Vitest tests — real input path, real transactions, real assertions.
  actions:
    - theme: brand
      text: Getting started
      link: /guide/getting-started
    - theme: alt
      text: API reference
      link: /guide/api
    - theme: alt
      text: View on GitHub
      link: https://github.com/marekdedic/vitest-prosemirror

features:
  - title: A real editor
    details: Mounts a genuine EditorView in jsdom, so plugins, keymaps, node views and input rules run exactly as they do in production.
  - title: Type like a user
    details: type drives ProseMirror's real DOM input path — keydown, character insertion, deletion and caret motion — not synthetic transactions.
  - title: Readable assertions
    details: toEqualProseMirrorNode and toHaveSelection compare documents as prosemirror-test-builder source, so failures read like the code you wrote.
---
