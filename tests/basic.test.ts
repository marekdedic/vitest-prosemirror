import { schema as basicSchema } from "prosemirror-schema-basic";
import { expect, test } from "vitest";

import { ProseMirrorTester } from "../src/index";

test("Parsing a document with an extension set", () => {
  const tree = basicSchema.nodes.doc.create(
    {},
    basicSchema.nodes.paragraph.createAndFill(
      {},
      basicSchema.text("Hello World!"),
    ),
  );

  const testEditor = new ProseMirrorTester(tree);

  expect(testEditor.schema.spec.nodes.size).toBe(9);
  expect(testEditor.schema.spec.marks.size).toBe(4);
  expect(testEditor.schema.spec.nodes.get("doc")).toBe(
    basicSchema.spec.nodes.get("doc"),
  );
  expect(testEditor.schema.spec.nodes.get("text")).toBe(
    basicSchema.spec.nodes.get("text"),
  );
  expect(testEditor.doc).toEqualProseMirrorNode(tree);
  expect(testEditor.doc).not.toEqualProseMirrorNode(
    basicSchema.nodes.hard_break.create(),
  );
});
