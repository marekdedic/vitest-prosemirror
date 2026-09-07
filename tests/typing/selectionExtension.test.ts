import { describe, expect, test } from "vitest";

import { ProseMirrorTester } from "../../src/index";
import { doc, p } from "../builders";

describe("selection extension", () => {
  test("should extend the selection forward from a caret", () => {
    const testEditor = new ProseMirrorTester(doc(p("H<caret>ello")));

    testEditor.selectText("caret");
    testEditor.insertText("{Shift-ArrowRight}");

    expect(testEditor.state.selection.anchor).toBe(2);
    expect(testEditor.state.selection.head).toBe(3);
  });

  test("should extend the selection backward from a caret", () => {
    const testEditor = new ProseMirrorTester(doc(p("He<caret>llo")));

    testEditor.selectText("caret");
    testEditor.insertText("{Shift-ArrowLeft}");

    expect(testEditor.state.selection.anchor).toBe(3);
    expect(testEditor.state.selection.head).toBe(2);
  });

  test("should extend over a whole grapheme cluster", () => {
    const testEditor = new ProseMirrorTester(doc(p("a<caret>👍b")));

    testEditor.selectText("caret");
    testEditor.insertText("{Shift-ArrowRight}");

    expect(testEditor.state.selection.from).toBe(2);
    expect(testEditor.state.selection.to).toBe(4);

    // Typing over the extended range replaces the whole emoji.
    testEditor.insertText("x");

    expect(testEditor.doc).toEqualProseMirrorNode(doc(p("axb")));
  });

  test("should shrink the selection when the head moves back", () => {
    const testEditor = new ProseMirrorTester(doc(p("Hello")));

    testEditor.selectText({ anchor: 2, head: 4 });
    testEditor.insertText("{Shift-ArrowLeft}");

    expect(testEditor.state.selection.anchor).toBe(2);
    expect(testEditor.state.selection.head).toBe(3);
  });

  test("should replace the range built by repeated extension", () => {
    const testEditor = new ProseMirrorTester(doc(p("<caret>Hello")));

    testEditor.selectText("caret");
    testEditor.insertText("{Shift-ArrowRight}{Shift-ArrowRight}x");

    expect(testEditor.doc).toEqualProseMirrorNode(doc(p("xllo")));
  });

  test("should throw for word motion and word extension", () => {
    const testEditor = new ProseMirrorTester(doc(p("Hello")));
    testEditor.selectText("start");

    expect(() => {
      testEditor.insertText("{Ctrl-ArrowRight}");
    }).toThrow('Cannot simulate the "ArrowRight" key');
    expect(() => {
      testEditor.insertText("{Shift-Ctrl-ArrowRight}");
    }).toThrow('Cannot simulate the "ArrowRight" key');
  });
});
