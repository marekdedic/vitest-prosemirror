import { type NodeSpec, Schema } from "prosemirror-model";
import { builders } from "prosemirror-test-builder";
import { describe, expect, test } from "vitest";

import { parseHTML } from "../src/index";

// Prosemirror-schema-basic has no table nodes, so build a minimal schema whose
// `parseDOM` rules exercise the table-context trap: a `td` rule reading a
// `data-align` attribute, mirroring the issue's worked example.
const nodes: Record<string, NodeSpec> = {
  doc: { content: "block+" },
  paragraph: {
    content: "text*",
    group: "block",
    parseDOM: [{ tag: "p" }],
    toDOM: () => ["p", 0],
  },
  table: {
    content: "tableRow+",
    group: "block",
    parseDOM: [{ tag: "table" }],
    toDOM: () => ["table", ["tbody", 0]],
  },
  tableCell: {
    attrs: { align: { default: null } },
    content: "text*",
    parseDOM: [
      {
        getAttrs: (dom: HTMLElement) => ({
          align: dom.getAttribute("data-align"),
        }),
        tag: "td",
      },
    ],
    toDOM: (node) => [
      "td",
      { "data-align": node.attrs["align"] as string | null },
      0,
    ],
  },
  tableRow: {
    content: "tableCell+",
    parseDOM: [{ tag: "tr" }],
    toDOM: () => ["tr", 0],
  },
  text: {},
};

const schema = new Schema({ nodes });
const { doc, paragraph, table, tableCell, tableRow } = builders(schema);

describe("parseHTML", () => {
  test("reads a bare table cell in the correct table context", () => {
    expect.assertions(1);

    // A lone `<td>` — exactly what `div.innerHTML` silently discards. The
    // parser wraps it into the required table/row ancestors.
    expect(
      parseHTML('<td data-align="right">hi</td>', schema),
    ).toEqualProseMirrorNode(
      doc(table(tableRow(tableCell({ align: "right" }, "hi")))),
    );
  });

  test("reads a full table", () => {
    expect.assertions(1);

    expect(
      parseHTML("<table><tr><td>hi</td></tr></table>", schema),
    ).toEqualProseMirrorNode(doc(table(tableRow(tableCell("hi")))));
  });

  test("parses non-table markup unchanged", () => {
    expect.assertions(1);

    expect(parseHTML("<p>hello</p>", schema)).toEqualProseMirrorNode(
      doc(paragraph("hello")),
    );
  });

  test("honours the topNode option", () => {
    expect.assertions(1);

    expect(
      parseHTML("hi", schema, {
        topNode: schema.nodes["tableCell"].create({ align: "left" }),
      }),
    ).toEqualProseMirrorNode(tableCell({ align: "left" }, "hi"));
  });

  test("honours the preserveWhitespace option", () => {
    expect.assertions(2);

    expect(parseHTML("<p>a   b</p>", schema).textContent).toBe("a b");
    expect(
      parseHTML("<p>a   b</p>", schema, { preserveWhitespace: true })
        .textContent,
    ).toBe("a   b");
  });
});
