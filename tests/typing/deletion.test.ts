import { baseKeymap } from "prosemirror-commands";
import { InputRule, inputRules, undoInputRule } from "prosemirror-inputrules";
import { keymap } from "prosemirror-keymap";
import { schema as basicSchema } from "prosemirror-schema-basic";
import { describe, expect, test } from "vitest";

import { ProseMirrorTester } from "../../src/index";

describe("deletion", () => {
  test("should delete the character before the cursor", () => {
    const initialDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("Hello World")),
    );

    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText(7);
    testEditor.insertText("{Backspace}");

    const expectedDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("HelloWorld")),
    );

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should delete at the end of a paragraph", () => {
    const initialDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("foo")),
    );

    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText("end");
    testEditor.insertText("{Backspace}{Backspace}");

    const expectedDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("f")),
    );

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should allow typing after emptying a paragraph", () => {
    const initialDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("a")),
    );

    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText("end");
    testEditor.insertText("{Backspace}b");

    const expectedDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("b")),
    );

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should delete the character after the cursor", () => {
    const initialDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("Hello World")),
    );

    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText(6);
    testEditor.insertText("{Delete}");

    const expectedDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("HelloWorld")),
    );

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should throw when passed the removed { from, to } form", () => {
    const initialDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("Hello World")),
    );

    const testEditor = new ProseMirrorTester(initialDoc);

    expect(() => {
      // @ts-expect-error -- { from, to } was removed in favour of { anchor, head }
      testEditor.selectText({ from: 6, to: 12 });
    }).toThrow("use { anchor, head } instead");
  });

  test("should delete a non-empty selection", () => {
    const initialDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("Hello World")),
    );

    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText({ anchor: 6, head: 12 });
    testEditor.insertText("{Backspace}");

    const expectedDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("Hello")),
    );

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should let 'deleteSelection' handle a non-empty selection", () => {
    const initialDoc = basicSchema.nodes.doc.create({}, [
      basicSchema.nodes.paragraph.create({}, basicSchema.text("Hello")),
      basicSchema.nodes.paragraph.create({}, basicSchema.text("World")),
    ]);

    const testEditor = new ProseMirrorTester(initialDoc, {
      plugins: [keymap(baseKeymap)],
    });

    testEditor.selectText({ anchor: 4, head: 10 });
    testEditor.insertText("{Backspace}");

    const expectedDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("Helrld")),
    );

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should let 'joinBackward' handle a block boundary", () => {
    const initialDoc = basicSchema.nodes.doc.create({}, [
      basicSchema.nodes.paragraph.create({}, basicSchema.text("ab")),
      basicSchema.nodes.paragraph.create({}, basicSchema.text("cd")),
    ]);

    const testEditor = new ProseMirrorTester(initialDoc, {
      plugins: [keymap(baseKeymap)],
    });

    testEditor.selectText(5);
    testEditor.insertText("{Backspace}");

    const expectedDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("abcd")),
    );

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should let 'joinForward' handle a block boundary", () => {
    const initialDoc = basicSchema.nodes.doc.create({}, [
      basicSchema.nodes.paragraph.create({}, basicSchema.text("ab")),
      basicSchema.nodes.paragraph.create({}, basicSchema.text("cd")),
    ]);

    const testEditor = new ProseMirrorTester(initialDoc, {
      plugins: [keymap(baseKeymap)],
    });

    testEditor.selectText(3);
    testEditor.insertText("{Delete}");

    const expectedDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("abcd")),
    );

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should lift out of a blockquote", () => {
    const initialDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.blockquote.create(
        {},
        basicSchema.nodes.paragraph.create({}, basicSchema.text("ab")),
      ),
    );

    const testEditor = new ProseMirrorTester(initialDoc, {
      plugins: [keymap(baseKeymap)],
    });

    testEditor.selectText(2);
    testEditor.insertText("{Backspace}");

    const expectedDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("ab")),
    );

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should undo an input rule", () => {
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
        keymap({ Backspace: undoInputRule }),
      ],
    });

    testEditor.selectText("end");
    testEditor.insertText("!!{Backspace}");

    const expectedDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("Hello World!!")),
    );

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should throw for an unhandled selection spanning several DOM nodes", () => {
    const initialDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, [
        basicSchema.text("ab", [basicSchema.marks.strong.create()]),
        basicSchema.text("cd"),
      ]),
    );

    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText({ anchor: 2, head: 4 });

    expect(() => {
      testEditor.insertText("{Backspace}");
    }).toThrow(
      "Cannot simulate deleting a range that is not inside a single text node",
    );
  });

  test("should throw for an unhandled selection with no text to delete", () => {
    const initialDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, [
        basicSchema.nodes.image.create({ src: "image.png" }),
      ]),
    );

    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText({ anchor: 1, head: 2 });

    expect(() => {
      testEditor.insertText("{Backspace}");
    }).toThrow(
      "Cannot simulate deleting a range that is not inside a single text node",
    );
  });

  // ProseMirror deletes an atom itself rather than letting the browser near it.
  test("should let ProseMirror delete an atom before the cursor", () => {
    const initialDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, [
        basicSchema.nodes.image.create({ src: "image.png" }),
      ]),
    );

    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText("end");
    testEditor.insertText("{Backspace}");

    const expectedDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}),
    );

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });
});
