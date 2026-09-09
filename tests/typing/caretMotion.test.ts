import { describe, expect, test } from "vitest";

import { ProseMirrorTester } from "../../src/index";
import { doc, p } from "../builders";

describe("caret motion", () => {
  const initialDoc = doc(p("H<selStart>e<caret>l<selEnd>lo"));

  test("should move the caret left", () => {
    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText("end");
    testEditor.type("{ArrowLeft}x");

    const expectedDoc = doc(p("Hellxo"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should move the caret right", () => {
    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText("caret");
    testEditor.type("{ArrowRight}x");

    const expectedDoc = doc(p("Helxlo"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should collapse a non-empty selection", () => {
    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText({ anchor: "selStart", head: "selEnd" });
    testEditor.type("{ArrowLeft}x");

    const expectedDoc = doc(p("Hxello"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should step over a surrogate-pair emoji when moving right", () => {
    const testEditor = new ProseMirrorTester(doc(p("a<caret>👍b")));

    testEditor.selectText("caret");
    testEditor.type("{ArrowRight}x");

    const expectedDoc = doc(p("a👍xb"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should step over a surrogate-pair emoji when moving left", () => {
    const testEditor = new ProseMirrorTester(doc(p("a👍<caret>b")));

    testEditor.selectText("caret");
    testEditor.type("{ArrowLeft}x");

    const expectedDoc = doc(p("ax👍b"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should step over a combining sequence in one keypress", () => {
    // Decomposed "e" + combining acute (U+0301): two code units, one grapheme.
    const testEditor = new ProseMirrorTester(doc(p("a<caret>éb")));

    testEditor.selectText("caret");
    testEditor.type("{ArrowRight}x");

    const expectedDoc = doc(p("aéxb"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should step over a ZWJ emoji sequence in one keypress", () => {
    const testEditor = new ProseMirrorTester(doc(p("a<caret>👨‍👩‍👧b")));

    testEditor.selectText("caret");
    testEditor.type("{ArrowRight}x");

    const expectedDoc = doc(p("a👨‍👩‍👧xb"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should stay put at the start of the document", () => {
    const testEditor = new ProseMirrorTester(doc(p("Hello")));

    testEditor.selectText("start");
    testEditor.type("{ArrowLeft}x");

    const expectedDoc = doc(p("xHello"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should cross a block boundary from the end of a text node", () => {
    const testEditor = new ProseMirrorTester(doc(p("ab<caret>"), p("cd")));

    testEditor.selectText("caret");
    testEditor.type("{ArrowRight}x");

    const expectedDoc = doc(p("ab"), p("xcd"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });
});
