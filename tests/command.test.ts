import { toggleMark, wrapIn } from "prosemirror-commands";
import { schema as basicSchema } from "prosemirror-schema-basic";
import { describe, expect, test } from "vitest";

import { ProseMirrorTester } from "../src/index";
import { doc, p, strong } from "./builders";

describe("command", () => {
  test("should apply a command and return true", () => {
    const initialDoc = doc(p("<a>some<b> text"));

    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText({ anchor: "a", head: "b" });

    expect(testEditor.command(toggleMark(basicSchema.marks.strong))).toBe(true);

    const expectedDoc = doc(p(strong("some"), " text"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should return false and leave the document unchanged when the command does not apply", () => {
    const initialDoc = doc(p("<a>some<b> text"));

    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText({ anchor: "a", head: "b" });

    // A horizontal_rule is a leaf and cannot contain the paragraph, so no
    // wrapping is possible and the command reports that it does not apply.
    expect(testEditor.command(wrapIn(basicSchema.nodes.horizontal_rule))).toBe(
      false,
    );

    expect(testEditor.doc).toEqualProseMirrorNode(initialDoc);
  });

  test("should see state produced by an earlier mutation", () => {
    const initialDoc = doc(p("some text"));

    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.insertText("x");
    testEditor.selectText("all");

    expect(testEditor.command(toggleMark(basicSchema.marks.strong))).toBe(true);

    const expectedDoc = doc(p(strong("xsome text")));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should pass the view to the command", () => {
    const initialDoc = doc(p("some text"));

    const testEditor = new ProseMirrorTester(initialDoc);

    let receivedView = false;
    testEditor.command((_state, _dispatch, view) => {
      receivedView = view !== undefined;
      return true;
    });

    expect(receivedView).toBe(true);
  });

  test("should throw when the tester has been destroyed", () => {
    const initialDoc = doc(p("some text"));

    const testEditor = new ProseMirrorTester(initialDoc);
    testEditor.destroy();

    expect(() =>
      testEditor.command(toggleMark(basicSchema.marks.strong)),
    ).toThrow("destroyed");
  });
});
