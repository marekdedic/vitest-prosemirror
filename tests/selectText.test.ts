import { toggleMark } from "prosemirror-commands";
import { keymap } from "prosemirror-keymap";
import { schema as basicSchema } from "prosemirror-schema-basic";
import { TextSelection } from "prosemirror-state";
import { describe, expect, test } from "vitest";

import { ProseMirrorTester } from "../src/index";

describe("selectText", () => {
  test("should handle the 'all' selection", () => {
    const initialDoc = basicSchema.nodes.doc.create({}, [
      basicSchema.nodes.paragraph.create({}, basicSchema.text("first")),
      basicSchema.nodes.paragraph.create({}, basicSchema.text("second")),
    ]);

    const testEditor = new ProseMirrorTester(initialDoc, {
      plugins: [
        keymap({
          "Mod-b": toggleMark(basicSchema.marks.strong),
        }),
      ],
    });

    testEditor.selectText("all");
    testEditor.insertText("{Mod-b}");

    const expectedDoc = basicSchema.nodes.doc.create({}, [
      basicSchema.nodes.paragraph.create({}, [
        basicSchema.text("first", [basicSchema.marks.strong.create()]),
      ]),
      basicSchema.nodes.paragraph.create({}, [
        basicSchema.text("second", [basicSchema.marks.strong.create()]),
      ]),
    ]);

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should accept a ProseMirror selection object", () => {
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

    testEditor.selectText(TextSelection.create(initialDoc, 1, 5));
    testEditor.insertText("{Mod-b}");

    const expectedDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, [
        basicSchema.text("some", [basicSchema.marks.strong.create()]),
        basicSchema.text(" text"),
      ]),
    );

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });
});
