import type { Node } from "prosemirror-model";

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

  test("should report a message when two equal nodes were expected to differ", () => {
    expect.assertions(2);

    expect(() => {
      expect(paragraph("same")).not.toEqualProseMirrorNode(paragraph("same"));
    }).toThrow(/Expected value of document to not equal/u);
  });
});
