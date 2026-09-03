import { schema as basicSchema } from "prosemirror-schema-basic";
import { describe, expect, test } from "vitest";

import { resolveSelection } from "../../src/utils/selection";

describe("resolveSelection", () => {
  const doc = basicSchema.nodes.doc.create(
    {},
    basicSchema.nodes.paragraph.create({}, basicSchema.text("Hello World")),
  );

  test("should preserve direction for a forward { anchor, head }", () => {
    const selection = resolveSelection(doc, { anchor: 3, head: 7 });

    expect(selection.anchor).toBe(3);
    expect(selection.head).toBe(7);
    expect(selection.from).toBe(3);
    expect(selection.to).toBe(7);
  });

  test("should preserve direction for a reversed { anchor, head }", () => {
    const selection = resolveSelection(doc, { anchor: 7, head: 3 });

    expect(selection.anchor).toBe(7);
    expect(selection.head).toBe(3);
    expect(selection.from).toBe(3);
    expect(selection.to).toBe(7);
  });
});
