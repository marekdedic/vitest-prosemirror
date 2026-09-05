import { describe, expect, test } from "vitest";

import { ProseMirrorTester } from "../../src/index";
import { doc, p } from "../builders";

describe("caret motion", () => {
  const initialDoc = doc(p("H<selStart>e<caret>l<selEnd>lo"));

  test("should move the caret left", () => {
    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText("end");
    testEditor.insertText("{ArrowLeft}x");

    const expectedDoc = doc(p("Hellxo"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should move the caret right", () => {
    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText("caret");
    testEditor.insertText("{ArrowRight}x");

    const expectedDoc = doc(p("Helxlo"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should collapse a non-empty selection", () => {
    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText({ anchor: "selStart", head: "selEnd" });
    testEditor.insertText("{ArrowLeft}x");

    const expectedDoc = doc(p("Hxello"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });
});
