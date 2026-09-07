import { type Node, Schema } from "prosemirror-model";
import { schema as basicSchema } from "prosemirror-schema-basic";
import { AllSelection, NodeSelection, TextSelection } from "prosemirror-state";
import { describe, expect, test } from "vitest";

import { stringifyProseMirrorNode } from "../src/stringifyProseMirrorNode";
import { doc, em, heading, hr, img, p, strong } from "./builders";

const tagOf = (node: Node, name: string): number =>
  (node as unknown as { tag: Record<string, number> }).tag[name];

test("Stringifying an empty node", () => {
  const tree = basicSchema.nodes.horizontal_rule.create();

  expect(stringifyProseMirrorNode(tree)).toBe("horizontal_rule()");
});

test("Stringifying a basic paragraph", () => {
  const tree = basicSchema.nodes.doc.create(
    {},
    basicSchema.nodes.paragraph.create({}, basicSchema.text("Hello World!")),
  );

  expect(stringifyProseMirrorNode(tree)).toBe(
    "doc(\n  paragraph('Hello World!'),\n)",
  );
});

test("Stringifying a paragraph in a blockquote", () => {
  const tree = basicSchema.nodes.doc.create(
    {},
    basicSchema.nodes.blockquote.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("Hello World!")),
    ),
  );

  expect(stringifyProseMirrorNode(tree)).toBe(
    "doc(\n  blockquote(\n    paragraph('Hello World!'),\n  ),\n)",
  );
});

test("Stringifying with attrs without content", () => {
  const tree = basicSchema.nodes.image.create({
    src: "img.jpg",
    title: "Image!",
  });

  expect(stringifyProseMirrorNode(tree)).toBe(
    "image(\n  {src: 'img.jpg', alt: null, title: 'Image!'},\n)",
  );
});

test("Stringifying with attrs and content", () => {
  const tree = basicSchema.nodes.heading.create(
    { level: 3 },
    basicSchema.text("Hello World!"),
  );

  expect(stringifyProseMirrorNode(tree)).toBe(
    "heading(\n  {level: 3},\n  'Hello World!',\n)",
  );
});

test("Stringifying text with an apostrophe", () => {
  const tree = basicSchema.text("it's a test");

  expect(stringifyProseMirrorNode(tree)).toBe("'it\\'s a test'");
});

test("Stringifying text with a backslash", () => {
  const tree = basicSchema.text("a\\b");

  expect(stringifyProseMirrorNode(tree)).toBe("'a\\\\b'");
});

test("Stringifying text with control characters", () => {
  const tree = basicSchema.text("a\nb\tc");

  expect(stringifyProseMirrorNode(tree)).toBe("'a\\nb\\tc'");
});

test("Stringifying text with bidirectional and format characters", () => {
  // U+202E RIGHT-TO-LEFT OVERRIDE, U+200F RIGHT-TO-LEFT MARK, U+200D ZERO WIDTH
  // JOINER -- all invisible and all Cf
  const tree = basicSchema.text("a\u202eb\u200fc\u200dd");

  expect(stringifyProseMirrorNode(tree)).toBe("'a\\u202eb\\u200fc\\u200dd'");
});

test("Stringifying whitespace-only text", () => {
  const tree = basicSchema.text(" ");

  expect(stringifyProseMirrorNode(tree)).toBe("' '");
});

test("Stringifying paragraph with a mark", () => {
  const tree = basicSchema.nodes.paragraph.create(
    {},
    basicSchema.text("Hello World!").mark([basicSchema.marks.strong.create()]),
  );

  expect(stringifyProseMirrorNode(tree)).toBe(
    "paragraph(strong('Hello World!'))",
  );
});

test("Stringifying paragraph with multiple marks", () => {
  const tree = basicSchema.nodes.paragraph.create(
    {},
    basicSchema
      .text("Hello World!")
      .mark([basicSchema.marks.strong.create(), basicSchema.marks.em.create()]),
  );

  expect(stringifyProseMirrorNode(tree)).toBe(
    "paragraph(strong(em('Hello World!')))",
  );
});

test("Stringifying paragraph with multiple partially overlaping marks", () => {
  const tree = basicSchema.nodes.paragraph.create({}, [
    basicSchema.text("Hello ").mark([basicSchema.marks.strong.create()]),
    basicSchema
      .text("World")
      .mark([basicSchema.marks.strong.create(), basicSchema.marks.em.create()]),
    basicSchema.text("!").mark([basicSchema.marks.strong.create()]),
  ]);

  expect(stringifyProseMirrorNode(tree)).toBe(
    "paragraph(\n  strong('Hello '),\n  strong(em('World')),\n  strong('!'),\n)",
  );
});

test("Stringifying a node type with a toDebugString hook", () => {
  const schema = new Schema({
    nodes: {
      doc: { content: "widget*" },
      text: {},
      widget: {
        attrs: { value: {} },
        inline: false,
        toDebugString: (node): string =>
          `widget=${String(node.attrs["value"])}`,
      },
    },
  });
  const tree = schema.nodes.doc.create({}, [
    schema.nodes.widget.create({ value: 1 }),
    schema.nodes.widget.create({ value: 2 }),
  ]);

  expect(stringifyProseMirrorNode(tree)).toBe(
    "doc(\n  widget=1,\n  widget=2,\n)",
  );
});

test("Stringifying a leaf node with a mark", () => {
  const tree = basicSchema.nodes.image
    .create({ src: "img.jpg" })
    .mark([basicSchema.marks.em.create()]);

  expect(stringifyProseMirrorNode(tree)).toBe(
    "em(image(\n  {src: 'img.jpg', alt: null, title: null},\n))",
  );
});

test("Stringifying a leaf node with a mark with attrs", () => {
  const tree = basicSchema.nodes.image
    .create({ src: "img.jpg" })
    .mark([basicSchema.marks.link.create({ href: "https://example.com" })]);

  expect(stringifyProseMirrorNode(tree)).toBe(
    "link({href: 'https://example.com', title: null}, image(\n  {src: 'img.jpg', alt: null, title: null},\n))",
  );
});

test("Stringifying paragraph with a mark with attrs", () => {
  const tree = basicSchema.nodes.paragraph.create(
    {},
    basicSchema
      .text("Hello World!")
      .mark([basicSchema.marks.link.create({ href: "https://example.com" })]),
  );

  expect(stringifyProseMirrorNode(tree)).toBe(
    "paragraph(link({href: 'https://example.com', title: null}, 'Hello World!'))",
  );
});

describe("prosemirror-test-builder correspondence", () => {
  test("paragraphs keep their real type name", () => {
    expect(stringifyProseMirrorNode(doc(p("Line one"), p()))).toBe(
      "doc(\n  paragraph('Line one'),\n  paragraph(),\n)",
    );
  });

  test("marks render under their builder names", () => {
    expect(
      stringifyProseMirrorNode(doc(p(strong("bold"), " and ", em("italic")))),
    ).toBe(
      "doc(\n  paragraph(\n    strong('bold'),\n    ' and ',\n    em('italic'),\n  ),\n)",
    );
  });

  test("headings keep their type name and attrs", () => {
    expect(stringifyProseMirrorNode(doc(heading({ level: 3 }, "Title")))).toBe(
      "doc(\n  heading(\n    {level: 3},\n    'Title',\n  ),\n)",
    );
  });

  test("leaf nodes keep their real type name", () => {
    expect(stringifyProseMirrorNode(doc(p("a"), hr(), p("b")))).toBe(
      "doc(\n  paragraph('a'),\n  horizontal_rule(),\n  paragraph('b'),\n)",
    );
  });

  test("nodes with attrs keep their type name", () => {
    expect(
      stringifyProseMirrorNode(
        doc(img({ alt: "A", src: "a.png", title: "T" })),
      ),
    ).toBe(
      "doc(\n  image(\n    {src: 'a.png', alt: 'A', title: 'T'},\n  ),\n)",
    );
  });
});

describe("selection markers", () => {
  test("no selection renders no markers", () => {
    const tree = doc(p("foobar"));

    expect(stringifyProseMirrorNode(tree)).toBe(
      "doc(\n  paragraph('foobar'),\n)",
    );
    expect(stringifyProseMirrorNode(tree)).toBe(
      stringifyProseMirrorNode(tree, undefined),
    );
  });

  test("a collapsed cursor collapses to a single marker", () => {
    const tree = doc(p("foobar"));
    const selection = TextSelection.create(tree, 4);

    expect(stringifyProseMirrorNode(tree, selection)).toBe(
      "doc(\n  paragraph('foo<cursor>bar'),\n)",
    );
  });

  test("a range inside one text node marks both ends", () => {
    const tree = doc(p("foobar"));
    const selection = TextSelection.create(tree, 4, 7);

    expect(stringifyProseMirrorNode(tree, selection)).toBe(
      "doc(\n  paragraph('foo<anchor>bar<head>'),\n)",
    );
  });

  test("markers order by position, not by anchor/head role", () => {
    const tree = doc(p("foobar"));
    const selection = TextSelection.create(tree, 7, 4);

    expect(stringifyProseMirrorNode(tree, selection)).toBe(
      "doc(\n  paragraph('foo<head>bar<anchor>'),\n)",
    );
  });

  test("a range spanning marks attaches each marker to its own segment", () => {
    const tree = doc(p(strong("foo"), "bar"));
    const selection = TextSelection.create(tree, 2, 6);

    expect(stringifyProseMirrorNode(tree, selection)).toBe(
      "doc(\n  paragraph(\n    strong('f<anchor>oo'),\n    'ba<head>r',\n  ),\n)",
    );
  });

  test("a marker on a text-node boundary attaches to the earlier node", () => {
    const tree = doc(p(strong("foo"), "bar"));
    const selection = TextSelection.create(tree, 1, 4);

    expect(stringifyProseMirrorNode(tree, selection)).toBe(
      "doc(\n  paragraph(\n    strong('<anchor>foo<head>'),\n    'bar',\n  ),\n)",
    );
  });

  test("a cursor in an empty node renders inside its parens", () => {
    const tree = doc(p("first"), p());
    const selection = TextSelection.create(tree, 8);

    expect(stringifyProseMirrorNode(tree, selection)).toBe(
      "doc(\n  paragraph('first'),\n  paragraph('<cursor>'),\n)",
    );
  });

  test("an AllSelection marks the document boundaries", () => {
    const tree = doc(p("a"), p("b"));
    const selection = new AllSelection(tree);

    expect(stringifyProseMirrorNode(tree, selection)).toBe(
      "doc(\n  '<anchor>',\n  paragraph('a'),\n  paragraph('b'),\n  '<head>',\n)",
    );
  });

  test("a NodeSelection brackets the selected node", () => {
    const tree = doc(p("a"), hr(), p("b"));
    const selection = NodeSelection.create(tree, 3);

    expect(stringifyProseMirrorNode(tree, selection)).toBe(
      "doc(\n  paragraph('a'),\n  '<anchor>',\n  horizontal_rule(),\n  '<head>',\n  paragraph('b'),\n)",
    );
  });

  test("markers inside marked text stay within the mark", () => {
    const tree = doc(p(strong("foobar")));
    const selection = TextSelection.create(tree, 2, 5);

    expect(stringifyProseMirrorNode(tree, selection)).toBe(
      "doc(\n  paragraph(strong('f<anchor>oob<head>ar')),\n)",
    );
  });

  test("round-trips prosemirror-test-builder tag notation", () => {
    const tree = doc(p("foo<anchor>bar<head>"));
    const selection = TextSelection.between(
      tree.resolve(tagOf(tree, "anchor")),
      tree.resolve(tagOf(tree, "head")),
    );

    expect(stringifyProseMirrorNode(tree, selection)).toBe(
      "doc(\n  paragraph('foo<anchor>bar<head>'),\n)",
    );
  });
});
