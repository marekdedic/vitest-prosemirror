import { type Node, Schema } from "prosemirror-model";
import { schema as basicSchema } from "prosemirror-schema-basic";
import { describe, expect, test } from "vitest";

import "../src/index";

const paragraph = (text: string): Node =>
  basicSchema.nodes.doc.create(
    {},
    basicSchema.nodes.paragraph.create({}, basicSchema.text(text)),
  );

describe("toEqualProseMirrorNode", () => {
  test("should report a diff when two nodes differ", () => {
    expect.assertions(4);

    expect(() => {
      expect(paragraph("received")).toEqualProseMirrorNode(
        paragraph("expected"),
      );
    }).toThrow(/Expected value of document to equal/u);

    expect(() => {
      expect(paragraph("received")).toEqualProseMirrorNode(
        paragraph("expected"),
      );
    }).toThrow(/Difference/u);
  });

  test("should fail when two structurally identical nodes come from different schemas", () => {
    expect.assertions(2);

    const otherSchema = new Schema({
      marks: basicSchema.spec.marks,
      nodes: basicSchema.spec.nodes,
    });
    const otherParagraph = otherSchema.nodes["doc"].create(
      {},
      otherSchema.nodes["paragraph"].create({}, otherSchema.text("same")),
    );

    expect(() => {
      expect(paragraph("same")).toEqualProseMirrorNode(otherParagraph);
    }).toThrow(/come from different schemas/u);
  });

  test("should report a message when two equal nodes were expected to differ", () => {
    expect.assertions(2);

    expect(() => {
      expect(paragraph("same")).not.toEqualProseMirrorNode(paragraph("same"));
    }).toThrow(/Expected value of document to not equal/u);
  });
});
