import { setBlockType, toggleMark, wrapIn } from "prosemirror-commands";
import { keymap } from "prosemirror-keymap";
import { schema as basicSchema } from "prosemirror-schema-basic";
import { describe, expect, test } from "vitest";

import { ProseMirrorTester } from "../../src/index";
import { blockquote, codeBlock, doc, p, strong } from "../builders";

describe("keymap", () => {
  test("should handle keybindings toggling marks", () => {
    const initialDoc = doc(p("<selStart>some text<selEnd>"));

    const testEditor = new ProseMirrorTester(initialDoc, {
      plugins: [
        keymap({
          "Mod-b": toggleMark(basicSchema.marks.strong),
        }),
      ],
    });

    testEditor.selectText({ anchor: "selStart", head: "selEnd" });
    testEditor.insertText("{Mod-b}");

    const expectedDoc = doc(p(strong("some text")));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should handle keybindings setting block type", () => {
    const initialDoc = doc(p("<selStart>some text<selEnd>"));

    const testEditor = new ProseMirrorTester(initialDoc, {
      plugins: [
        keymap({
          "Mod-b": setBlockType(basicSchema.nodes.code_block),
        }),
      ],
    });

    testEditor.selectText({ anchor: "selStart", head: "selEnd" });
    testEditor.insertText("{Mod-b}");

    const expectedDoc = doc(codeBlock("some text"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should apply a chord's modifier only to its own token", () => {
    const initialDoc = doc(p());

    const testEditor = new ProseMirrorTester(initialDoc, {
      plugins: [
        keymap({
          "Mod-b": toggleMark(basicSchema.marks.strong),
        }),
      ],
    });

    testEditor.selectText("end");
    testEditor.insertText("{Mod-b}bold{Mod-b} normal");

    const expectedDoc = doc(p(strong("bold"), " normal"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  // Shift-b produces the "B" key, so prosemirror-keymap binds it as the uppercase letter.
  const wrappingEditor = (): ProseMirrorTester =>
    new ProseMirrorTester(doc(p("<selStart>some text<selEnd>")), {
      plugins: [
        keymap({
          B: wrapIn(basicSchema.nodes.blockquote),
        }),
      ],
    });

  const wrappedDoc = doc(blockquote(p("some text")));

  test("should handle an uppercase-letter keybinding triggered with Shift", () => {
    const testEditor = wrappingEditor();

    testEditor.selectText({ anchor: "selStart", head: "selEnd" });
    testEditor.insertText("{Shift-b}");

    expect(testEditor.doc).toEqualProseMirrorNode(wrappedDoc);
  });

  test("should handle an uppercase-letter keybinding typed directly", () => {
    const testEditor = wrappingEditor();

    testEditor.selectText({ anchor: "selStart", head: "selEnd" });
    testEditor.insertText("B");

    expect(testEditor.doc).toEqualProseMirrorNode(wrappedDoc);
  });

  test("should not trigger a Shift-<letter> binding, as a browser does not", () => {
    const testEditor = new ProseMirrorTester(doc(p()), {
      plugins: [
        keymap({
          "Shift-b": wrapIn(basicSchema.nodes.blockquote),
        }),
      ],
    });

    testEditor.selectText("start");
    testEditor.insertText("{Shift-b}");

    const expectedDoc = doc(p("B"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });
});
