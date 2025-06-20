import { schema as basicSchema } from "prosemirror-schema-basic";
import { expect, test } from "vitest";

import { stringifyProseMirrorNode } from "../src/stringifyProseMirrorNode";

test("Stringifying an empty node", () => {
  const tree = basicSchema.nodes.horizontal_rule.create();

  expect(stringifyProseMirrorNode(tree)).toBe("horizontal_rule()");
});

test("Stringifying a basic paragraph", () => {
  const tree = basicSchema.nodes.doc.create(
    {},
    basicSchema.nodes.paragraph.create({}, basicSchema.text("Hello World!")),
  );

  expect(stringifyProseMirrorNode(tree)).toBe("doc(\n  p('Hello World!'),\n)");
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
    "doc(\n  blockquote(\n    p('Hello World!'),\n  ),\n)",
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
    "h(\n  {level: 3},\n  'Hello World!',\n)",
  );
});

test("Stringifying paragraph with a mark", () => {
  const tree = basicSchema.nodes.paragraph.create(
    {},
    basicSchema.text("Hello World!").mark([basicSchema.marks.strong.create()]),
  );

  expect(stringifyProseMirrorNode(tree)).toBe("p(strong('Hello World!'))");
});

test("Stringifying paragraph with multiple marks", () => {
  const tree = basicSchema.nodes.paragraph.create(
    {},
    basicSchema
      .text("Hello World!")
      .mark([basicSchema.marks.strong.create(), basicSchema.marks.em.create()]),
  );

  expect(stringifyProseMirrorNode(tree)).toBe("p(strong(em('Hello World!')))");
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
    "p(\n  strong('Hello '),\n  strong(em('World')),\n  strong('!'),\n)",
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
    "p(link({href: 'https://example.com', title: null}, 'Hello World!'))",
  );
});
