import { describe, expect, test } from "vitest";

import "../src/index";
import { blockquote, doc, em, heading, p, strong } from "./builders";

describe("snapshot serializer", () => {
  test("serializes a simple paragraph inline", () => {
    expect(doc(p("Hello World!"))).toMatchInlineSnapshot(`
      doc(
        paragraph('Hello World!'),
      )
    `);
  });

  test("serializes marks, attrs and nesting", () => {
    expect(doc(heading({ level: 2 }, strong(em("Title"))), blockquote(p("q"))))
      .toMatchInlineSnapshot(`
        doc(
          heading(
            {level: 2},
            em(strong('Title')),
          ),
          blockquote(
            paragraph('q'),
          ),
        )
      `);
  });

  test("serializes a bare node built directly", () => {
    expect(p("just a paragraph")).toMatchInlineSnapshot(
      `paragraph('just a paragraph')`,
    );
  });

  test("leaves plain objects, arrays and strings to the default serializer", () => {
    expect({ a: 1, b: "two" }).toMatchInlineSnapshot(`
      {
        "a": 1,
        "b": "two",
      }
    `);
    expect([1, 2, 3]).toMatchInlineSnapshot(`
      [
        1,
        2,
        3,
      ]
    `);
    expect("just a string").toMatchInlineSnapshot(`"just a string"`);
  });

  test("does not match node-like objects missing the schema", () => {
    // A structurally node-like object without a real `type.schema` must fall
    // through to the default serializer rather than the ProseMirror one.
    const fake = {
      attrs: {},
      content: [],
      marks: [],
      type: { name: "paragraph" },
    };

    expect(fake).toMatchInlineSnapshot(`
      {
        "attrs": {},
        "content": [],
        "marks": [],
        "type": {
          "name": "paragraph",
        },
      }
    `);
  });
});
