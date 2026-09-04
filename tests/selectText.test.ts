import { toggleMark } from "prosemirror-commands";
import { keymap } from "prosemirror-keymap";
import { schema as basicSchema } from "prosemirror-schema-basic";
import { TextSelection } from "prosemirror-state";
import { describe, expect, test } from "vitest";

import { ProseMirrorTester } from "../src/index";
import { doc, p, strong } from "./builders";

describe("selectText", () => {
  test("should handle the 'all' selection", () => {
    const initialDoc = doc(p("first"), p("second"));

    const testEditor = new ProseMirrorTester(initialDoc, {
      plugins: [
        keymap({
          "Mod-b": toggleMark(basicSchema.marks.strong),
        }),
      ],
    });

    testEditor.selectText("all");
    testEditor.insertText("{Mod-b}");

    const expectedDoc = doc(p(strong("first")), p(strong("second")));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should accept a ProseMirror selection object", () => {
    const initialDoc = doc(p("some text"));

    const testEditor = new ProseMirrorTester(initialDoc, {
      plugins: [
        keymap({
          "Mod-b": toggleMark(basicSchema.marks.strong),
        }),
      ],
    });

    testEditor.selectText(TextSelection.create(initialDoc, 1, 5));
    testEditor.insertText("{Mod-b}");

    const expectedDoc = doc(p(strong("some"), " text"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });
});
