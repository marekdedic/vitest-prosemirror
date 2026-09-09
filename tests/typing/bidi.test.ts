import { describe, expect, test } from "vitest";

import { renderProseMirror } from "../../src/index";
import { doc, em, p } from "../builders";

describe("bidi caret motion", () => {
  test("should throw for ArrowLeft in right-to-left text", () => {
    const testEditor = renderProseMirror(doc(p("א<caret>בג")));
    testEditor.setSelection("caret");

    expect(() => {
      testEditor.type("{ArrowLeft}");
    }).toThrow("right-to-left");
  });

  test("should throw for ArrowRight in right-to-left text", () => {
    const testEditor = renderProseMirror(doc(p("א<caret>בג")));
    testEditor.setSelection("caret");

    expect(() => {
      testEditor.type("{ArrowRight}");
    }).toThrow("right-to-left");
  });

  test("should throw for Shift-extension in right-to-left text", () => {
    const testEditor = renderProseMirror(doc(p("א<caret>בג")));
    testEditor.setSelection("caret");

    expect(() => {
      testEditor.type("{Shift-ArrowRight}");
    }).toThrow("right-to-left");
  });

  test("should throw when a plain arrow collapses an RTL selection", () => {
    const testEditor = renderProseMirror(doc(p("אבג")));
    testEditor.setSelection({ anchor: 1, head: 4 });

    expect(() => {
      testEditor.type("{ArrowRight}");
    }).toThrow("right-to-left");
  });

  test("should still move within the LTR node of a mixed paragraph", () => {
    const testEditor = renderProseMirror(doc(p("a<caret>bc", em("אבג"))));
    testEditor.setSelection("caret");

    // Moving left stays inside the Latin text node, so it is unaffected.
    expect(() => {
      testEditor.type("{ArrowLeft}x");
    }).not.toThrow();
    expect(testEditor.doc).toEqualProseMirrorNode(doc(p("xabc", em("אבג"))));
  });
});
