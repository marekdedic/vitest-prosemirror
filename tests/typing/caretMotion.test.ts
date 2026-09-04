import { describe, expect, test } from "vitest";

import { ProseMirrorTester } from "../../src/index";
import { doc, p } from "../builders";

describe("caret motion", () => {
  const initialDoc = doc(p("Hello"));

  test("should move the caret left", () => {
    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText("end");
    testEditor.insertText("{ArrowLeft}x");

    const expectedDoc = doc(p("Hellxo"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should move the caret right", () => {
    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText(3);
    testEditor.insertText("{ArrowRight}x");

    const expectedDoc = doc(p("Helxlo"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should collapse a non-empty selection", () => {
    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText({ anchor: 2, head: 4 });
    testEditor.insertText("{ArrowLeft}x");

    const expectedDoc = doc(p("Hxello"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });
});
