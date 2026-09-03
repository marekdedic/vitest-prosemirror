import { schema as basicSchema } from "prosemirror-schema-basic";
import { TextSelection } from "prosemirror-state";
import { expect, test } from "vitest";

import { ProseMirrorTester } from "../src/index";

const makeTester = (text = "Hello World"): ProseMirrorTester => {
  const doc = basicSchema.nodes.doc.create(
    {},
    basicSchema.nodes.paragraph.create(
      {},
      text === "" ? undefined : basicSchema.text(text),
    ),
  );
  return new ProseMirrorTester(doc);
};

test("state exposes the current EditorState", () => {
  const testEditor = makeTester();

  expect(testEditor.state.schema).toBe(basicSchema);
  expect(testEditor.state.doc).toEqualProseMirrorNode(testEditor.doc);
});

test("state is a live getter, not a snapshot", () => {
  const testEditor = makeTester("");

  const before = testEditor.state;
  testEditor.insertText("a");

  expect(testEditor.state).not.toBe(before);
  expect(testEditor.state.doc).toEqualProseMirrorNode(
    basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("a")),
    ),
  );
});

test("state reflects the selection", () => {
  const testEditor = makeTester();

  testEditor.selectText({ anchor: 3, head: 7 });

  expect(testEditor.state.selection).toBeInstanceOf(TextSelection);
  expect(testEditor.state.selection.from).toBe(3);
  expect(testEditor.state.selection.to).toBe(7);
});

test("html exposes the rendered markup", () => {
  const testEditor = makeTester();

  expect(testEditor.html).toBe("<p>Hello World</p>");
});

test("text exposes the rendered text", () => {
  const testEditor = makeTester();

  expect(testEditor.text).toBe("Hello World");
});
