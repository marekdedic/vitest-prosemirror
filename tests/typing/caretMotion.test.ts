import { describe, expect, test } from "vitest";

import { renderProseMirror } from "../../src/index";
import { doc, p } from "../builders";

describe("caret motion", () => {
  const initialDoc = doc(p("H<selStart>e<caret>l<selEnd>lo"));

  test("should move the caret left", () => {
    const testEditor = renderProseMirror(initialDoc);

    testEditor.setSelection("end");
    testEditor.type("{ArrowLeft}x");

    const expectedDoc = doc(p("Hellxo"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should move the caret right", () => {
    const testEditor = renderProseMirror(initialDoc);

    testEditor.setSelection("caret");
    testEditor.type("{ArrowRight}x");

    const expectedDoc = doc(p("Helxlo"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should collapse a non-empty selection", () => {
    const testEditor = renderProseMirror(initialDoc);

    testEditor.setSelection({ anchor: "selStart", head: "selEnd" });
    testEditor.type("{ArrowLeft}x");

    const expectedDoc = doc(p("Hxello"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should step over a surrogate-pair emoji when moving right", () => {
    const testEditor = renderProseMirror(doc(p("a<caret>👍b")));

    testEditor.setSelection("caret");
    testEditor.type("{ArrowRight}x");

    const expectedDoc = doc(p("a👍xb"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should step over a surrogate-pair emoji when moving left", () => {
    const testEditor = renderProseMirror(doc(p("a👍<caret>b")));

    testEditor.setSelection("caret");
    testEditor.type("{ArrowLeft}x");

    const expectedDoc = doc(p("ax👍b"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should step over a combining sequence in one keypress", () => {
    // Decomposed "e" + combining acute (U+0301): two code units, one grapheme.
    const testEditor = renderProseMirror(doc(p("a<caret>éb")));

    testEditor.setSelection("caret");
    testEditor.type("{ArrowRight}x");

    const expectedDoc = doc(p("aéxb"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should step over a ZWJ emoji sequence in one keypress", () => {
    const testEditor = renderProseMirror(doc(p("a<caret>👨‍👩‍👧b")));

    testEditor.setSelection("caret");
    testEditor.type("{ArrowRight}x");

    const expectedDoc = doc(p("a👨‍👩‍👧xb"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should stay put at the start of the document", () => {
    const testEditor = renderProseMirror(doc(p("Hello")));

    testEditor.setSelection("start");
    testEditor.type("{ArrowLeft}x");

    const expectedDoc = doc(p("xHello"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should cross a block boundary from the end of a text node", () => {
    const testEditor = renderProseMirror(doc(p("ab<caret>"), p("cd")));

    testEditor.setSelection("caret");
    testEditor.type("{ArrowRight}x");

    const expectedDoc = doc(p("ab"), p("xcd"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });
});
