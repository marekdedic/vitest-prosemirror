import { schema as basicSchema } from "prosemirror-schema-basic";
import { describe, expect, test } from "vitest";

import { ProseMirrorTester } from "../../src/index";

describe("caret motion", () => {
  const initialDoc = basicSchema.nodes.doc.create(
    {},
    basicSchema.nodes.paragraph.create({}, basicSchema.text("Hello")),
  );

  test("should move the caret left", () => {
    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText("end");
    testEditor.insertText("{ArrowLeft}x");

    const expectedDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("Hellxo")),
    );

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should move the caret right", () => {
    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText(3);
    testEditor.insertText("{ArrowRight}x");

    const expectedDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("Helxlo")),
    );

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should collapse a non-empty selection", () => {
    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText({ anchor: 2, head: 4 });
    testEditor.insertText("{ArrowLeft}x");

    const expectedDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("Hxello")),
    );

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });
});
