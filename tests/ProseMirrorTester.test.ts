import {
  baseKeymap,
  setBlockType,
  toggleMark,
  wrapIn,
} from "prosemirror-commands";
import { InputRule, inputRules } from "prosemirror-inputrules";
import { keymap } from "prosemirror-keymap";
import { schema as basicSchema } from "prosemirror-schema-basic";
import { TextSelection } from "prosemirror-state";
import { describe, expect, test } from "vitest";

import { ProseMirrorTester } from "../src/index";

test("Basic tester", () => {
  const tree = basicSchema.nodes.doc.create(
    {},
    basicSchema.nodes.paragraph.createAndFill(
      {},
      basicSchema.text("Hello World!"),
    ),
  );

  const testEditor = new ProseMirrorTester(tree);

  expect(testEditor.schema.spec.nodes.size).toBe(9);
  expect(testEditor.schema.spec.marks.size).toBe(4);
  expect(testEditor.schema.spec.nodes.get("doc")).toBe(
    basicSchema.spec.nodes.get("doc"),
  );
  expect(testEditor.schema.spec.nodes.get("text")).toBe(
    basicSchema.spec.nodes.get("text"),
  );
  expect(testEditor.doc).toEqualProseMirrorNode(tree);
});

describe("insertText", () => {
  test("should insert a single character into an empty paragraph", () => {
    const initialDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}),
    );

    const testEditor = new ProseMirrorTester(initialDoc);
    testEditor.selectText("start");
    testEditor.insertText("a");

    const expectedDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("a")),
    );

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should insert text at the end of an existing paragraph", () => {
    const initialDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("Hello")),
    );

    const testEditor = new ProseMirrorTester(initialDoc);
    testEditor.selectText("end");
    testEditor.insertText(" World!");

    const expectedDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("Hello World!")),
    );

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should insert text in the middle of an existing paragraph", () => {
    const initialDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("Helloworld")),
    );

    const testEditor = new ProseMirrorTester(initialDoc);
    testEditor.selectText(6);
    testEditor.insertText(" ");

    const expectedDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("Hello world")),
    );

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should handle 'Enter' to split a paragraph", () => {
    const initialDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("Line one")),
    );

    const testEditor = new ProseMirrorTester(initialDoc, {
      plugins: [keymap(baseKeymap)],
    });

    testEditor.selectText("end");
    testEditor.insertText("{Enter}");

    const expectedDoc = basicSchema.nodes.doc.create({}, [
      basicSchema.nodes.paragraph.create({}, basicSchema.text("Line one")),
      basicSchema.nodes.paragraph.create({}),
    ]);

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should handle 'Tab'", () => {
    const initialDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("HelloWorld!")),
    );

    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText(6);
    testEditor.insertText("{Tab}");

    const expectedDoc = basicSchema.nodes.doc.create({}, [
      basicSchema.nodes.paragraph.create({}, basicSchema.text("Hello\tWorld!")),
    ]);

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should do nothing when the selection has no text node to insert into", () => {
    const initialDoc = basicSchema.nodes.doc.create({}, [
      basicSchema.nodes.paragraph.create({}, [
        basicSchema.nodes.image.create({ src: "image.png" }),
      ]),
    ]);

    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText("end");
    testEditor.insertText("a");

    expect(testEditor.doc).toEqualProseMirrorNode(initialDoc);
  });
});

describe("keymap", () => {
  test("should handle keybindings toggling marks", () => {
    const initialDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("some text")),
    );

    const testEditor = new ProseMirrorTester(initialDoc, {
      plugins: [
        keymap({
          "Mod-b": toggleMark(basicSchema.marks.strong),
        }),
      ],
    });

    testEditor.selectText({ from: 1, to: 10 });
    testEditor.insertText("b", { ctrlKey: true });

    const expectedDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, [
        basicSchema.text("some text", [basicSchema.marks.strong.create()]),
      ]),
    );

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should handle keybindings setting block type", () => {
    const initialDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("some text")),
    );

    const testEditor = new ProseMirrorTester(initialDoc, {
      plugins: [
        keymap({
          "Mod-b": setBlockType(basicSchema.nodes.code_block),
        }),
      ],
    });

    testEditor.selectText({ from: 1, to: 10 });
    testEditor.insertText("b", { ctrlKey: true });

    const expectedDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.code_block.create({}, [basicSchema.text("some text")]),
    );

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should handle keybindings wrapping node", () => {
    const initialDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("some text")),
    );

    const testEditor = new ProseMirrorTester(initialDoc, {
      plugins: [
        keymap({
          "Shift-b": wrapIn(basicSchema.nodes.blockquote),
        }),
      ],
    });

    testEditor.selectText({ from: 1, to: 10 });
    testEditor.insertText("b", { shiftKey: true });

    const expectedDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.blockquote.create({}, [
        basicSchema.nodes.paragraph.create({}, [basicSchema.text("some text")]),
      ]),
    );

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });
});

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

describe("selectText", () => {
  test("should handle the 'all' selection", () => {
    const initialDoc = basicSchema.nodes.doc.create({}, [
      basicSchema.nodes.paragraph.create({}, basicSchema.text("first")),
      basicSchema.nodes.paragraph.create({}, basicSchema.text("second")),
    ]);

    const testEditor = new ProseMirrorTester(initialDoc, {
      plugins: [
        keymap({
          "Mod-b": toggleMark(basicSchema.marks.strong),
        }),
      ],
    });

    testEditor.selectText("all");
    testEditor.insertText("b", { ctrlKey: true });

    const expectedDoc = basicSchema.nodes.doc.create({}, [
      basicSchema.nodes.paragraph.create({}, [
        basicSchema.text("first", [basicSchema.marks.strong.create()]),
      ]),
      basicSchema.nodes.paragraph.create({}, [
        basicSchema.text("second", [basicSchema.marks.strong.create()]),
      ]),
    ]);

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should accept a ProseMirror selection object", () => {
    const initialDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("some text")),
    );

    const testEditor = new ProseMirrorTester(initialDoc, {
      plugins: [
        keymap({
          "Mod-b": toggleMark(basicSchema.marks.strong),
        }),
      ],
    });

    testEditor.selectText(TextSelection.create(initialDoc, 1, 5));
    testEditor.insertText("b", { ctrlKey: true });

    const expectedDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, [
        basicSchema.text("some", [basicSchema.marks.strong.create()]),
        basicSchema.text(" text"),
      ]),
    );

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });
});
