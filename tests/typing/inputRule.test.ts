import { InputRule, inputRules } from "prosemirror-inputrules";
import { schema as basicSchema } from "prosemirror-schema-basic";
import { describe, expect, test } from "vitest";

import { ProseMirrorTester } from "../../src/index";

describe("input rule", () => {
  test("should handle input rule", () => {
    const initialDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("Hello World")),
    );

    const testEditor = new ProseMirrorTester(initialDoc, {
      plugins: [
        inputRules({
          rules: [
            new InputRule(/!!/u, (state, _, start, end) =>
              state.tr.replaceWith(start, end, basicSchema.text("XX")),
            ),
          ],
        }),
      ],
    });

    testEditor.selectText("end");
    testEditor.insertText("!!");

    const expectedDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, [
        basicSchema.text("Hello WorldXX"),
      ]),
    );

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should handle unfinished input rule", () => {
    const initialDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("Hello World")),
    );

    const testEditor = new ProseMirrorTester(initialDoc, {
      plugins: [
        inputRules({
          rules: [
            new InputRule(/!!/u, (state, _, start, end) =>
              state.tr.replaceWith(start, end, basicSchema.text("XX")),
            ),
          ],
        }),
      ],
    });

    testEditor.selectText("end");
    testEditor.insertText("!");

    const expectedDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, [
        basicSchema.text("Hello World!"),
      ]),
    );

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should handle input rule with a character after", () => {
    const initialDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("Hello World")),
    );

    const testEditor = new ProseMirrorTester(initialDoc, {
      plugins: [
        inputRules({
          rules: [
            new InputRule(/!!/u, (state, _, start, end) =>
              state.tr.replaceWith(start, end, basicSchema.text("XX")),
            ),
          ],
        }),
      ],
    });

    testEditor.selectText("end");
    testEditor.insertText("!!Y");

    const expectedDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, [
        basicSchema.text("Hello WorldXXY"),
      ]),
    );

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });
});
