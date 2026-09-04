import { schema as basicSchema } from "prosemirror-schema-basic";
import { TextSelection } from "prosemirror-state";
import { expect, test } from "vitest";

import { ProseMirrorTester } from "../src/index";
import { doc, p } from "./builders";

const makeTester = (text = "Hello World"): ProseMirrorTester => {
  const testDoc = doc(text === "" ? p() : p(text));
  return new ProseMirrorTester(testDoc);
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
  expect(testEditor.state.doc).toEqualProseMirrorNode(doc(p("a")));
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
