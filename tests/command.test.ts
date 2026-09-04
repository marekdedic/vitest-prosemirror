import { toggleMark, wrapIn } from "prosemirror-commands";
import { schema as basicSchema } from "prosemirror-schema-basic";
import { describe, expect, test } from "vitest";

import { ProseMirrorTester } from "../src/index";

describe("command", () => {
  test("should apply a command and return true", () => {
    const initialDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("some text")),
    );

    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText({ anchor: 1, head: 5 });

    expect(testEditor.command(toggleMark(basicSchema.marks.strong))).toBe(true);

    const expectedDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, [
        basicSchema.text("some", [basicSchema.marks.strong.create()]),
        basicSchema.text(" text"),
      ]),
    );

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should return false and leave the document unchanged when the command does not apply", () => {
    const initialDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("some text")),
    );

    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText({ anchor: 1, head: 5 });

    // A horizontal_rule is a leaf and cannot contain the paragraph, so no
    // wrapping is possible and the command reports that it does not apply.
    expect(testEditor.command(wrapIn(basicSchema.nodes.horizontal_rule))).toBe(
      false,
    );

    expect(testEditor.doc).toEqualProseMirrorNode(initialDoc);
  });

  test("should see state produced by an earlier mutation", () => {
    const initialDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("some text")),
    );

    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.insertText("x");
    testEditor.selectText("all");

    expect(testEditor.command(toggleMark(basicSchema.marks.strong))).toBe(true);

    const expectedDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, [
        basicSchema.text("xsome text", [basicSchema.marks.strong.create()]),
      ]),
    );

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should pass the view to the command", () => {
    const initialDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("some text")),
    );

    const testEditor = new ProseMirrorTester(initialDoc);

    let receivedView = false;
    testEditor.command((_state, _dispatch, view) => {
      receivedView = view !== undefined;
      return true;
    });

    expect(receivedView).toBe(true);
  });

  test("should throw when the tester has been destroyed", () => {
    const initialDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("some text")),
    );

    const testEditor = new ProseMirrorTester(initialDoc);
    testEditor.destroy();

    expect(() =>
      testEditor.command(toggleMark(basicSchema.marks.strong)),
    ).toThrow("destroyed");
  });
});
