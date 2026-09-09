import { baseKeymap } from "prosemirror-commands";
import { InputRule, inputRules, undoInputRule } from "prosemirror-inputrules";
import { keymap } from "prosemirror-keymap";
import { schema as basicSchema } from "prosemirror-schema-basic";
import { describe, expect, test } from "vitest";

import { renderProseMirror } from "../../src/index";
import { blockquote, doc, img, p, strong } from "../builders";

describe("deletion", () => {
  test("should delete the character before the cursor", () => {
    const initialDoc = doc(p("Hello <cursor>World"));

    const testEditor = renderProseMirror(initialDoc);

    testEditor.setSelection("cursor");
    testEditor.type("{Backspace}");

    const expectedDoc = doc(p("HelloWorld"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should delete at the end of a paragraph", () => {
    const initialDoc = doc(p("foo"));

    const testEditor = renderProseMirror(initialDoc);

    testEditor.setSelection("end");
    testEditor.type("{Backspace}{Backspace}");

    const expectedDoc = doc(p("f"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should allow typing after emptying a paragraph", () => {
    const initialDoc = doc(p("a"));

    const testEditor = renderProseMirror(initialDoc);

    testEditor.setSelection("end");
    testEditor.type("{Backspace}b");

    const expectedDoc = doc(p("b"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should delete the character after the cursor", () => {
    const initialDoc = doc(p("Hello<cursor> World"));

    const testEditor = renderProseMirror(initialDoc);

    testEditor.setSelection("cursor");
    testEditor.type("{Delete}");

    const expectedDoc = doc(p("HelloWorld"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should throw when passed the removed { from, to } form", () => {
    const initialDoc = doc(p("Hello World"));

    const testEditor = renderProseMirror(initialDoc);

    expect(() => {
      // @ts-expect-error -- { from, to } was removed in favour of { anchor, head }
      testEditor.setSelection({ from: 6, to: 12 });
    }).toThrow("use { anchor, head } instead");
  });

  test("should delete a non-empty selection", () => {
    const initialDoc = doc(p("Hello<selStart> World<selEnd>"));

    const testEditor = renderProseMirror(initialDoc);

    testEditor.setSelection({ anchor: "selStart", head: "selEnd" });
    testEditor.type("{Backspace}");

    const expectedDoc = doc(p("Hello"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should let 'deleteSelection' handle a non-empty selection", () => {
    const initialDoc = doc(p("Hel<selStart>lo"), p("Wo<selEnd>rld"));

    const testEditor = renderProseMirror(initialDoc, {
      plugins: [keymap(baseKeymap)],
    });

    testEditor.setSelection({ anchor: "selStart", head: "selEnd" });
    testEditor.type("{Backspace}");

    const expectedDoc = doc(p("Helrld"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should let 'joinBackward' handle a block boundary", () => {
    const initialDoc = doc(p("ab"), p("<cursor>cd"));

    const testEditor = renderProseMirror(initialDoc, {
      plugins: [keymap(baseKeymap)],
    });

    testEditor.setSelection("cursor");
    testEditor.type("{Backspace}");

    const expectedDoc = doc(p("abcd"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should let 'joinForward' handle a block boundary", () => {
    const initialDoc = doc(p("ab<cursor>"), p("cd"));

    const testEditor = renderProseMirror(initialDoc, {
      plugins: [keymap(baseKeymap)],
    });

    testEditor.setSelection("cursor");
    testEditor.type("{Delete}");

    const expectedDoc = doc(p("abcd"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should lift out of a blockquote", () => {
    const initialDoc = doc(blockquote(p("<cursor>ab")));

    const testEditor = renderProseMirror(initialDoc, {
      plugins: [keymap(baseKeymap)],
    });

    testEditor.setSelection("cursor");
    testEditor.type("{Backspace}");

    const expectedDoc = doc(p("ab"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should undo an input rule", () => {
    const initialDoc = doc(p("Hello World"));

    const testEditor = renderProseMirror(initialDoc, {
      plugins: [
        inputRules({
          rules: [
            new InputRule(/!!/u, (state, _, start, end) =>
              state.tr.replaceWith(start, end, basicSchema.text("XX")),
            ),
          ],
        }),
        keymap({ Backspace: undoInputRule }),
      ],
    });

    testEditor.setSelection("end");
    testEditor.type("!!{Backspace}");

    const expectedDoc = doc(p("Hello World!!"));

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should throw for an unhandled selection spanning several DOM nodes", () => {
    const initialDoc = doc(p(strong("a<selStart>b"), "c<selEnd>d"));

    const testEditor = renderProseMirror(initialDoc);

    testEditor.setSelection({ anchor: "selStart", head: "selEnd" });

    expect(() => {
      testEditor.type("{Backspace}");
    }).toThrow(
      "Cannot simulate deleting a range that is not inside a single text node",
    );
  });

  test("should throw for an unhandled selection with no text to delete", () => {
    const initialDoc = doc(p(img({ src: "image.png" })));

    const testEditor = renderProseMirror(initialDoc);

    testEditor.setSelection({ anchor: 1, head: 2 });

    expect(() => {
      testEditor.type("{Backspace}");
    }).toThrow(
      "Cannot simulate deleting a range that is not inside a single text node",
    );
  });

  // ProseMirror deletes an atom itself rather than letting the browser near it.
  test("should let ProseMirror delete an atom before the cursor", () => {
    const initialDoc = doc(p(img({ src: "image.png" })));

    const testEditor = renderProseMirror(initialDoc);

    testEditor.setSelection("end");
    testEditor.type("{Backspace}");

    const expectedDoc = doc(p());

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });
});
