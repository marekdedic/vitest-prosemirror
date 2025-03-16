import { schema as basicSchema } from "prosemirror-schema-basic";
import { expect, test } from "vitest";

import { trimProseMirrorNode } from "../src/index";

test("Trims empty paragraph from the start", () => {
  expect(
    trimProseMirrorNode(
      basicSchema.nodes.doc.create({}, [
        basicSchema.nodes.paragraph.create(),
        basicSchema.nodes.paragraph.create(
          {},
          basicSchema.text("Hello World!"),
        ),
      ]),
    ),
  ).toEqualProseMirrorNode(
    basicSchema.nodes.doc.create({}, [
      basicSchema.nodes.paragraph.create({}, basicSchema.text("Hello World!")),
    ]),
  );

  expect(
    trimProseMirrorNode(
      basicSchema.nodes.doc.create({}, [
        basicSchema.nodes.paragraph.create({}, basicSchema.text("\n")),
        basicSchema.nodes.paragraph.create(
          {},
          basicSchema.text("Hello World!"),
        ),
      ]),
    ),
  ).toEqualProseMirrorNode(
    basicSchema.nodes.doc.create({}, [
      basicSchema.nodes.paragraph.create({}, basicSchema.text("Hello World!")),
    ]),
  );

  expect(
    trimProseMirrorNode(
      basicSchema.nodes.doc.create({}, [
        basicSchema.nodes.paragraph.create(),
        basicSchema.nodes.paragraph.create(),
        basicSchema.nodes.paragraph.create(
          {},
          basicSchema.text("Hello World!"),
        ),
      ]),
    ),
  ).toEqualProseMirrorNode(
    basicSchema.nodes.doc.create({}, [
      basicSchema.nodes.paragraph.create({}, basicSchema.text("Hello World!")),
    ]),
  );
});

test("Trims empty paragraph from the end", () => {
  expect(
    trimProseMirrorNode(
      basicSchema.nodes.doc.create({}, [
        basicSchema.nodes.paragraph.create(
          {},
          basicSchema.text("Hello World!"),
        ),
        basicSchema.nodes.paragraph.create(),
      ]),
    ),
  ).toEqualProseMirrorNode(
    basicSchema.nodes.doc.create({}, [
      basicSchema.nodes.paragraph.create({}, basicSchema.text("Hello World!")),
    ]),
  );

  expect(
    trimProseMirrorNode(
      basicSchema.nodes.doc.create({}, [
        basicSchema.nodes.paragraph.create(
          {},
          basicSchema.text("Hello World!"),
        ),
        basicSchema.nodes.paragraph.create({}, basicSchema.text("\n")),
      ]),
    ),
  ).toEqualProseMirrorNode(
    basicSchema.nodes.doc.create({}, [
      basicSchema.nodes.paragraph.create({}, basicSchema.text("Hello World!")),
    ]),
  );

  expect(
    trimProseMirrorNode(
      basicSchema.nodes.doc.create({}, [
        basicSchema.nodes.paragraph.create(
          {},
          basicSchema.text("Hello World!"),
        ),
        basicSchema.nodes.paragraph.create(),
        basicSchema.nodes.paragraph.create(),
      ]),
    ),
  ).toEqualProseMirrorNode(
    basicSchema.nodes.doc.create({}, [
      basicSchema.nodes.paragraph.create({}, basicSchema.text("Hello World!")),
    ]),
  );
});
