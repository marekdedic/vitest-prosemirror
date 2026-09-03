import { setBlockType, toggleMark, wrapIn } from "prosemirror-commands";
import { keymap } from "prosemirror-keymap";
import { schema as basicSchema } from "prosemirror-schema-basic";
import { describe, expect, test } from "vitest";

import { ProseMirrorTester } from "../../src/index";

describe("keymap", () => {
  test("should handle keybindings toggling marks", () => {
    const initialDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("some text")),
    );

    const testEditor = new ProseMirrorTester(initialDoc, {
      plugins: [
        keymap({
          "Mod-b": toggleMark(basicSchema.marks.strong),
        }),
      ],
    });

    testEditor.selectText({ anchor: 1, head: 10 });
    testEditor.insertText("{Mod-b}");

    const expectedDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, [
        basicSchema.text("some text", [basicSchema.marks.strong.create()]),
      ]),
    );

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should handle keybindings setting block type", () => {
    const initialDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("some text")),
    );

    const testEditor = new ProseMirrorTester(initialDoc, {
      plugins: [
        keymap({
          "Mod-b": setBlockType(basicSchema.nodes.code_block),
        }),
      ],
    });

    testEditor.selectText({ anchor: 1, head: 10 });
    testEditor.insertText("{Mod-b}");

    const expectedDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.code_block.create({}, [basicSchema.text("some text")]),
    );

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should apply a chord's modifier only to its own token", () => {
    const initialDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}),
    );

    const testEditor = new ProseMirrorTester(initialDoc, {
      plugins: [
        keymap({
          "Mod-b": toggleMark(basicSchema.marks.strong),
        }),
      ],
    });

    testEditor.selectText("end");
    testEditor.insertText("{Mod-b}bold{Mod-b} normal");

    const expectedDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, [
        basicSchema.text("bold", [basicSchema.marks.strong.create()]),
        basicSchema.text(" normal"),
      ]),
    );

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  // Shift-b produces the "B" key, so prosemirror-keymap binds it as the uppercase letter.
  const wrappingEditor = (): ProseMirrorTester =>
    new ProseMirrorTester(
      basicSchema.nodes.doc.create(
        {},
        basicSchema.nodes.paragraph.create({}, basicSchema.text("some text")),
      ),
      {
        plugins: [
          keymap({
            B: wrapIn(basicSchema.nodes.blockquote),
          }),
        ],
      },
    );

  const wrappedDoc = basicSchema.nodes.doc.create(
    {},
    basicSchema.nodes.blockquote.create({}, [
      basicSchema.nodes.paragraph.create({}, [basicSchema.text("some text")]),
    ]),
  );

  test("should handle an uppercase-letter keybinding triggered with Shift", () => {
    const testEditor = wrappingEditor();

    testEditor.selectText({ anchor: 1, head: 10 });
    testEditor.insertText("{Shift-b}");

    expect(testEditor.doc).toEqualProseMirrorNode(wrappedDoc);
  });

  test("should handle an uppercase-letter keybinding typed directly", () => {
    const testEditor = wrappingEditor();

    testEditor.selectText({ anchor: 1, head: 10 });
    testEditor.insertText("B");

    expect(testEditor.doc).toEqualProseMirrorNode(wrappedDoc);
  });

  test("should not trigger a Shift-<letter> binding, as a browser does not", () => {
    const testEditor = new ProseMirrorTester(
      basicSchema.nodes.doc.create({}, basicSchema.nodes.paragraph.create({})),
      {
        plugins: [
          keymap({
            "Shift-b": wrapIn(basicSchema.nodes.blockquote),
          }),
        ],
      },
    );

    testEditor.selectText("start");
    testEditor.insertText("{Shift-b}");

    const expectedDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("B")),
    );

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });
});
