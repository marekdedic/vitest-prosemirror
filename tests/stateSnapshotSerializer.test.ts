import { toggleMark } from "prosemirror-commands";
import { schema as basicSchema } from "prosemirror-schema-basic";
import { AllSelection, NodeSelection } from "prosemirror-state";
import { describe, expect, test } from "vitest";

import { ProseMirrorTester } from "../src/ProseMirrorTester";
import { doc, hr, p } from "./builders";

describe("state snapshot serializer", () => {
  test("serializes a text selection with inline markers and a kind line", () => {
    const t = new ProseMirrorTester(doc(p("foobar")));
    t.selectText({ anchor: 4, head: 7 });

    expect(t.state).toMatchInlineSnapshot(`
      doc(
        paragraph('foo<anchor>bar<head>'),
      )
      # selection: TextSelection 4..7
    `);
  });

  test("accepts the tester itself", () => {
    const t = new ProseMirrorTester(doc(p("foobar")));
    t.selectText({ anchor: 4, head: 7 });

    expect(t).toMatchInlineSnapshot(`
      doc(
        paragraph('foo<anchor>bar<head>'),
      )
      # selection: TextSelection 4..7
    `);
  });

  test("renders a collapsed cursor with a single marker", () => {
    const t = new ProseMirrorTester(doc(p("foobar")));
    t.selectText(4);

    expect(t.state).toMatchInlineSnapshot(`
      doc(
        paragraph('foo<cursor>bar'),
      )
      # selection: TextSelection 4..4
    `);
  });

  test("names an AllSelection whose markers span the whole doc", () => {
    const d = doc(p("foobar"));
    const t = new ProseMirrorTester(d);
    t.selectText(new AllSelection(d));

    expect(t.state).toMatchInlineSnapshot(`
      doc(
        '<anchor>',
        paragraph('foobar'),
        '<head>',
      )
      # selection: AllSelection 0..8
    `);
  });

  test("names a NodeSelection", () => {
    const d = doc(p("foo"), hr());
    const t = new ProseMirrorTester(d);
    t.selectText(NodeSelection.create(d, 5));

    expect(t.state).toMatchInlineSnapshot(`
      doc(
        paragraph('foo'),
        '<anchor>',
        horizontal_rule(),
        '<head>',
      )
      # selection: NodeSelection 5..6
    `);
  });

  test("renders stored marks", () => {
    const t = new ProseMirrorTester(doc(p("foobar")));
    t.selectText(4);
    t.command(toggleMark(basicSchema.marks.strong));

    expect(t.state).toMatchInlineSnapshot(`
      doc(
        paragraph('foo<cursor>bar'),
      )
      # selection: TextSelection 4..4
      # storedMarks: [strong]
    `);
  });

  test("renders stored marks losslessly, including attrs", () => {
    const t = new ProseMirrorTester(doc(p("foobar")));
    t.selectText(4);
    t.command((state, dispatch) => {
      dispatch?.(
        state.tr.setStoredMarks([
          basicSchema.marks.link.create({ href: "https://x", title: null }),
        ]),
      );
      return true;
    });

    expect(t.state).toMatchInlineSnapshot(`
      doc(
        paragraph('foo<cursor>bar'),
      )
      # selection: TextSelection 4..4
      # storedMarks: [link({href: 'https://x', title: null})]
    `);
  });

  test("omits the stored-marks line for an empty editor (storedMarks null)", () => {
    const t = new ProseMirrorTester(doc(p("foobar")));

    expect(t.state.storedMarks).toBeNull();
    expect(t.state).toMatchInlineSnapshot(`
      doc(
        paragraph('<cursor>foobar'),
      )
      # selection: TextSelection 1..1
    `);
  });

  test("leaves plain objects and a bare node to their own serializers", () => {
    // A state-shaped fake whose `.doc` is not a real node falls through.
    const fake = {
      doc: { type: { name: "doc" } },
      selection: { from: 0, to: 0 },
      storedMarks: null,
    };

    expect(fake).toMatchInlineSnapshot(`
      {
        "doc": {
          "type": {
            "name": "doc",
          },
        },
        "selection": {
          "from": 0,
          "to": 0,
        },
        "storedMarks": null,
      }
    `);

    // A bare node still goes through the node serializer, not this one.
    expect(doc(p("x"))).toMatchInlineSnapshot(`
      doc(
        paragraph('x'),
      )
    `);
  });
});
