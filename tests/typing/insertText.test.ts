import { baseKeymap } from "prosemirror-commands";
import { keymap } from "prosemirror-keymap";
import { describe, expect, test } from "vitest";

import { ProseMirrorTester } from "../../src/index";
import { br, doc, img, p, strong } from "../builders";

describe("insertText", () => {
  test("should insert a single character into an empty paragraph", () => {
    const initialDoc = doc(p());

    const testEditor = new ProseMirrorTester(initialDoc);
    testEditor.selectText("start");
    testEditor.insertText("a");

    const expectedDoc = doc(p("a"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should insert text at the end of an existing paragraph", () => {
    const initialDoc = doc(p("Hello"));

    const testEditor = new ProseMirrorTester(initialDoc);
    testEditor.selectText("end");
    testEditor.insertText(" World!");

    const expectedDoc = doc(p("Hello World!"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should insert text in the middle of an existing paragraph", () => {
    const initialDoc = doc(p("Hello<cursor>world"));

    const testEditor = new ProseMirrorTester(initialDoc);
    testEditor.selectText("cursor");
    testEditor.insertText(" ");

    const expectedDoc = doc(p("Hello world"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should handle 'Enter' to split a paragraph", () => {
    const initialDoc = doc(p("Line one"));

    const testEditor = new ProseMirrorTester(initialDoc, {
      plugins: [keymap(baseKeymap)],
    });

    testEditor.selectText("end");
    testEditor.insertText("{Enter}");

    const expectedDoc = doc(p("Line one"), p());

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should leave the document alone for an unhandled 'Tab'", () => {
    const initialDoc = doc(p("Hello<cursor>World!"));

    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText("cursor");
    testEditor.insertText("{Tab}");

    expect(testEditor.doc).toEqualProseMirrorNode(initialDoc);
  });

  test("should leave the document alone for a modifier key", () => {
    const initialDoc = doc(p("Hello"));

    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText("end");
    testEditor.insertText("{Shift}{Control}{Alt}{Meta}{CapsLock}");

    expect(testEditor.doc).toEqualProseMirrorNode(initialDoc);
  });

  test.each([
    ["a key with no simulable effect", "{Home}", "Home"],
    ["a key whose motion cannot be measured", "{ArrowUp}", "ArrowUp"],
    ["an unknown key", "{Nonsense}", "Nonsense"],
  ])("should throw for %s", (_name, input, key) => {
    const initialDoc = doc(p("Hello"));

    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText("end");

    expect(() => {
      testEditor.insertText(input);
    }).toThrow(`Cannot simulate the "${key}" key`);
  });

  test("should throw for an arrow key with a modifier", () => {
    const initialDoc = doc(p("Hello"));

    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText("end");

    expect(() => {
      testEditor.insertText("{Ctrl-ArrowLeft}");
    }).toThrow('Cannot simulate the "ArrowLeft" key');
  });

  test("should insert after a node that is not text", () => {
    const initialDoc = doc(p(img({ src: "image.png" })));

    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText("end");
    testEditor.insertText("a");

    const expectedDoc = doc(p(img({ src: "image.png" }), "a"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should insert at the start of a paragraph", () => {
    const initialDoc = doc(p("ello"));

    const testEditor = new ProseMirrorTester(initialDoc);
    testEditor.selectText("start");
    testEditor.insertText("H");

    const expectedDoc = doc(p("Hello"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should insert before the text following a node that is not text", () => {
    const initialDoc = doc(p(img({ src: "image.png" }), "<cursor>bc"));

    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText("cursor");
    testEditor.insertText("a");

    const expectedDoc = doc(p(img({ src: "image.png" }), "abc"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should insert after a trailing hard break", () => {
    const initialDoc = doc(p("Hello", br()));

    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText("end");
    testEditor.insertText("a");

    const expectedDoc = doc(p("Hello", br(), "a"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should insert into the text node the cursor is in, not the last one", () => {
    const initialDoc = doc(p(strong("a<cursor>b"), "cd"));

    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText("cursor");
    testEditor.insertText("x");

    const expectedDoc = doc(p(strong("axb"), "cd"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should replace a non-empty selection with typed text", () => {
    const initialDoc = doc(p("Hello <selStart>World<selEnd>"));

    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText({ anchor: "selStart", head: "selEnd" });
    testEditor.insertText("there");

    const expectedDoc = doc(p("Hello there"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should replace a non-empty selection with a single character", () => {
    const initialDoc = doc(p("Hello <selStart>World<selEnd>"));

    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText({ anchor: "selStart", head: "selEnd" });
    testEditor.insertText("X");

    const expectedDoc = doc(p("Hello X"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should replace a selection at the start of a text node", () => {
    const initialDoc = doc(p("<selStart>X<selEnd>ello"));

    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText({ anchor: "selStart", head: "selEnd" });
    testEditor.insertText("H");

    const expectedDoc = doc(p("Hello"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should allow typing after replacing a whole paragraph's contents", () => {
    const initialDoc = doc(p("<selStart>a<selEnd>"));

    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText({ anchor: "selStart", head: "selEnd" });
    testEditor.insertText("b");

    const expectedDoc = doc(p("b"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should preserve the marks when replacing a selection", () => {
    const initialDoc = doc(p(strong("a<selStart>bc<selEnd>")));

    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText({ anchor: "selStart", head: "selEnd" });
    testEditor.insertText("X");

    const expectedDoc = doc(p(strong("aX")));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should throw when replacing a selection spanning several DOM nodes", () => {
    const initialDoc = doc(p(strong("a<selStart>b"), "c<selEnd>d"));

    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText({ anchor: "selStart", head: "selEnd" });

    expect(() => {
      testEditor.insertText("X");
    }).toThrow(
      "Cannot simulate deleting a range that is not inside a single text node",
    );
  });

  test("should throw when replacing a selection over an atom", () => {
    const initialDoc = doc(p(img({ src: "image.png" })));

    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText({ anchor: 1, head: 2 });

    expect(() => {
      testEditor.insertText("a");
    }).toThrow(
      "Cannot simulate deleting a range that is not inside a single text node",
    );
  });
});
