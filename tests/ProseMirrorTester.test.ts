import {
  baseKeymap,
  setBlockType,
  toggleMark,
  wrapIn,
} from "prosemirror-commands";
import { InputRule, inputRules, undoInputRule } from "prosemirror-inputrules";
import { keymap } from "prosemirror-keymap";
import { schema as basicSchema } from "prosemirror-schema-basic";
import { Plugin, TextSelection } from "prosemirror-state";
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

  test("should leave the document alone for an unhandled 'Tab'", () => {
    const initialDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("HelloWorld!")),
    );

    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText(6);
    testEditor.insertText("{Tab}");

    expect(testEditor.doc).toEqualProseMirrorNode(initialDoc);
  });

  test("should leave the document alone for a modifier key", () => {
    const initialDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("Hello")),
    );

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
    const initialDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("Hello")),
    );

    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText("end");

    expect(() => {
      testEditor.insertText(input);
    }).toThrow(`Cannot simulate the "${key}" key`);
  });

  test("should throw for an arrow key with a modifier", () => {
    const initialDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("Hello")),
    );

    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText("end");

    expect(() => {
      testEditor.insertText("{ArrowLeft}", { ctrlKey: true });
    }).toThrow('Cannot simulate the "ArrowLeft" key');
  });

  test("should insert after a node that is not text", () => {
    const initialDoc = basicSchema.nodes.doc.create({}, [
      basicSchema.nodes.paragraph.create({}, [
        basicSchema.nodes.image.create({ src: "image.png" }),
      ]),
    ]);

    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText("end");
    testEditor.insertText("a");

    const expectedDoc = basicSchema.nodes.doc.create({}, [
      basicSchema.nodes.paragraph.create({}, [
        basicSchema.nodes.image.create({ src: "image.png" }),
        basicSchema.text("a"),
      ]),
    ]);

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should insert at the start of a paragraph", () => {
    const initialDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("ello")),
    );

    const testEditor = new ProseMirrorTester(initialDoc);
    testEditor.selectText("start");
    testEditor.insertText("H");

    const expectedDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("Hello")),
    );

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should insert before the text following a node that is not text", () => {
    const initialDoc = basicSchema.nodes.doc.create({}, [
      basicSchema.nodes.paragraph.create({}, [
        basicSchema.nodes.image.create({ src: "image.png" }),
        basicSchema.text("bc"),
      ]),
    ]);

    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText(2);
    testEditor.insertText("a");

    const expectedDoc = basicSchema.nodes.doc.create({}, [
      basicSchema.nodes.paragraph.create({}, [
        basicSchema.nodes.image.create({ src: "image.png" }),
        basicSchema.text("abc"),
      ]),
    ]);

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should insert after a trailing hard break", () => {
    const initialDoc = basicSchema.nodes.doc.create({}, [
      basicSchema.nodes.paragraph.create({}, [
        basicSchema.text("Hello"),
        basicSchema.nodes.hard_break.create(),
      ]),
    ]);

    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText("end");
    testEditor.insertText("a");

    const expectedDoc = basicSchema.nodes.doc.create({}, [
      basicSchema.nodes.paragraph.create({}, [
        basicSchema.text("Hello"),
        basicSchema.nodes.hard_break.create(),
        basicSchema.text("a"),
      ]),
    ]);

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should insert into the text node the cursor is in, not the last one", () => {
    const initialDoc = basicSchema.nodes.doc.create({}, [
      basicSchema.nodes.paragraph.create({}, [
        basicSchema.text("ab", [basicSchema.marks.strong.create()]),
        basicSchema.text("cd"),
      ]),
    ]);

    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText(2);
    testEditor.insertText("x");

    const expectedDoc = basicSchema.nodes.doc.create({}, [
      basicSchema.nodes.paragraph.create({}, [
        basicSchema.text("axb", [basicSchema.marks.strong.create()]),
        basicSchema.text("cd"),
      ]),
    ]);

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });
});

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

  test("should delete a non-empty selection", () => {
    const initialDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("Hello World")),
    );

    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText({ from: 6, to: 12 });
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

    testEditor.selectText({ from: 4, to: 10 });
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

    testEditor.selectText({ from: 2, to: 4 });

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

    testEditor.selectText({ from: 1, to: 2 });

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

describe("caret motion", () => {
  const initialDoc = basicSchema.nodes.doc.create(
    {},
    basicSchema.nodes.paragraph.create({}, basicSchema.text("Hello")),
  );

  test("should move the caret left", () => {
    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText("end");
    testEditor.insertText("{ArrowLeft}x");

    const expectedDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("Hellxo")),
    );

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should move the caret right", () => {
    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText(3);
    testEditor.insertText("{ArrowRight}x");

    const expectedDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("Helxlo")),
    );

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should collapse a non-empty selection", () => {
    const testEditor = new ProseMirrorTester(initialDoc);

    testEditor.selectText({ from: 2, to: 4 });
    testEditor.insertText("{ArrowLeft}x");

    const expectedDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("Hxello")),
    );

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
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

  // Shift-b produces the "B" key, so prosemirror-keymap binds it as the uppercase letter.
  const wrappingEditor = (): ProseMirrorTester =>
    new ProseMirrorTester(
      basicSchema.nodes.doc.create(
        {},
        basicSchema.nodes.paragraph.create({}, basicSchema.text("some text")),
      ),
      {
        plugins: [
          keymap({
            B: wrapIn(basicSchema.nodes.blockquote),
          }),
        ],
      },
    );

  const wrappedDoc = basicSchema.nodes.doc.create(
    {},
    basicSchema.nodes.blockquote.create({}, [
      basicSchema.nodes.paragraph.create({}, [basicSchema.text("some text")]),
    ]),
  );

  test("should handle an uppercase-letter keybinding triggered with Shift", () => {
    const testEditor = wrappingEditor();

    testEditor.selectText({ from: 1, to: 10 });
    testEditor.insertText("b", { shiftKey: true });

    expect(testEditor.doc).toEqualProseMirrorNode(wrappedDoc);
  });

  test("should handle an uppercase-letter keybinding typed directly", () => {
    const testEditor = wrappingEditor();

    testEditor.selectText({ from: 1, to: 10 });
    testEditor.insertText("B");

    expect(testEditor.doc).toEqualProseMirrorNode(wrappedDoc);
  });

  test("should not trigger a Shift-<letter> binding, as a browser does not", () => {
    const testEditor = new ProseMirrorTester(
      basicSchema.nodes.doc.create({}, basicSchema.nodes.paragraph.create({})),
      {
        plugins: [
          keymap({
            "Shift-b": wrapIn(basicSchema.nodes.blockquote),
          }),
        ],
      },
    );

    testEditor.selectText("start");
    testEditor.insertText("b", { shiftKey: true });

    const expectedDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("B")),
    );

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });
});

describe("modifier suppression", () => {
  const initialDoc = basicSchema.nodes.doc.create(
    {},
    basicSchema.nodes.paragraph.create({}, basicSchema.text("foo")),
  );

  test.each([{ ctrlKey: true }, { metaKey: true }, { altKey: true }])(
    "should not type a character while a suppressing modifier is held (%o)",
    (modifiers) => {
      const testEditor = new ProseMirrorTester(initialDoc);
      testEditor.selectText("end");

      testEditor.insertText("b", modifiers);

      expect(testEditor.doc).toEqualProseMirrorNode(initialDoc);
    },
  );

  test("should type the uppercase letter while Shift is held", () => {
    const testEditor = new ProseMirrorTester(initialDoc);
    testEditor.selectText("end");

    testEditor.insertText("b", { shiftKey: true });

    const expectedDoc = basicSchema.nodes.doc.create(
      {},
      basicSchema.nodes.paragraph.create({}, basicSchema.text("fooB")),
    );

    expect(testEditor.doc).toEqualProseMirrorNode(expectedDoc);
  });

  test("should fire no keypress for a suppressed character key", () => {
    const events: Array<string> = [];
    const plugin = new Plugin({
      props: {
        handleDOMEvents: {
          keypress: (_view, event): false => {
            events.push(event.type);
            return false;
          },
          keyup: (_view, event): false => {
            events.push(event.type);
            return false;
          },
        },
        handleKeyDown: (_view, event): false => {
          events.push(event.type);
          return false;
        },
      },
    });
    const testEditor = new ProseMirrorTester(initialDoc, { plugins: [plugin] });
    testEditor.selectText("end");

    testEditor.insertText("b", { ctrlKey: true });

    expect(events).toStrictEqual(["keydown", "keyup"]);
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

describe("keyboard events", () => {
  const recordEvents = (): {
    events: Array<{ code: string; key: string; keyCode: number; type: string }>;
    plugin: Plugin;
  } => {
    const events: Array<{
      code: string;
      key: string;
      keyCode: number;
      type: string;
    }> = [];
    const record = (event: KeyboardEvent): false => {
      events.push({
        code: event.code,
        key: event.key,
        // eslint-disable-next-line @typescript-eslint/no-deprecated -- Testing the deprecated property
        keyCode: event.keyCode,
        type: event.type,
      });
      return false;
    };

    return {
      events,
      plugin: new Plugin({
        props: {
          handleDOMEvents: {
            keypress: (_view, event) => record(event),
            keyup: (_view, event) => record(event),
          },
          handleKeyDown: (_view, event) => record(event),
        },
      }),
    };
  };

  const initialDoc = basicSchema.nodes.doc.create(
    {},
    basicSchema.nodes.paragraph.createAndFill({}, basicSchema.text("foo")),
  );

  test("should set key, code and keyCode for a character key", () => {
    const { events, plugin } = recordEvents();
    const testEditor = new ProseMirrorTester(initialDoc, { plugins: [plugin] });
    testEditor.selectText("end");

    testEditor.insertText("a");

    expect(events).toStrictEqual([
      { code: "KeyA", key: "a", keyCode: 65, type: "keydown" },
      { code: "KeyA", key: "a", keyCode: 97, type: "keypress" },
      { code: "KeyA", key: "a", keyCode: 65, type: "keyup" },
    ]);
  });

  test("should set the same identity for the [KeyA] syntax", () => {
    const { events, plugin } = recordEvents();
    const testEditor = new ProseMirrorTester(initialDoc, { plugins: [plugin] });
    testEditor.selectText("end");

    testEditor.insertText("[KeyA]");

    expect(events).toStrictEqual([
      { code: "KeyA", key: "a", keyCode: 65, type: "keydown" },
      { code: "KeyA", key: "a", keyCode: 97, type: "keypress" },
      { code: "KeyA", key: "a", keyCode: 65, type: "keyup" },
    ]);
  });

  test("should dispatch cancelable, composed events carrying the key location", () => {
    const keydownEvents: Array<KeyboardEvent> = [];
    const plugin = new Plugin({
      props: {
        handleKeyDown: (_view, event): false => {
          keydownEvents.push(event);
          return false;
        },
      },
    });
    const testEditor = new ProseMirrorTester(initialDoc, { plugins: [plugin] });
    testEditor.selectText("end");

    testEditor.insertText("a{Shift}");

    expect(
      keydownEvents.map((event) => ({
        cancelable: event.cancelable,
        code: event.code,
        composed: event.composed,
        location: event.location,
      })),
    ).toStrictEqual([
      { cancelable: true, code: "KeyA", composed: true, location: 0 },
      { cancelable: true, code: "ShiftLeft", composed: true, location: 1 },
    ]);
  });

  test("should fire keyup even when the keydown was cancelled", () => {
    const { events, plugin } = recordEvents();
    const testEditor = new ProseMirrorTester(initialDoc, {
      plugins: [plugin, keymap(baseKeymap)],
    });
    testEditor.selectText("end");

    testEditor.insertText("{Enter}");

    // BaseKeymap handles Enter, so only the keypress is suppressed.
    expect(events).toStrictEqual([
      { code: "Enter", key: "Enter", keyCode: 13, type: "keydown" },
      { code: "Enter", key: "Enter", keyCode: 13, type: "keyup" },
    ]);
  });

  test("should set charCode only on keypress", () => {
    const charCodes: Array<{ charCode: number; type: string }> = [];
    const plugin = new Plugin({
      props: {
        handleDOMEvents: {
          keypress: (_view, event): false => {
            charCodes.push({
              // eslint-disable-next-line @typescript-eslint/no-deprecated -- Testing the deprecated property
              charCode: event.charCode,
              type: event.type,
            });
            return false;
          },
          keyup: (_view, event): false => {
            charCodes.push({
              // eslint-disable-next-line @typescript-eslint/no-deprecated -- Testing the deprecated property
              charCode: event.charCode,
              type: event.type,
            });
            return false;
          },
        },
        handleKeyDown: (_view, event): false => {
          charCodes.push({
            // eslint-disable-next-line @typescript-eslint/no-deprecated -- Testing the deprecated property
            charCode: event.charCode,
            type: event.type,
          });
          return false;
        },
      },
    });
    const testEditor = new ProseMirrorTester(initialDoc, { plugins: [plugin] });
    testEditor.selectText("end");

    testEditor.insertText("a");

    expect(charCodes).toStrictEqual([
      { charCode: 0, type: "keydown" },
      { charCode: 97, type: "keypress" },
      { charCode: 0, type: "keyup" },
    ]);
  });

  test("should set the keyCode of named keys", () => {
    const { events, plugin } = recordEvents();
    const testEditor = new ProseMirrorTester(initialDoc, { plugins: [plugin] });
    testEditor.selectText("end");

    testEditor.insertText("{Backspace}{ArrowLeft}{Escape}");

    // Named keys produce no character, so they fire no keypress.
    expect(events).toStrictEqual([
      { code: "Backspace", key: "Backspace", keyCode: 8, type: "keydown" },
      { code: "Backspace", key: "Backspace", keyCode: 8, type: "keyup" },
      { code: "ArrowLeft", key: "ArrowLeft", keyCode: 37, type: "keydown" },
      { code: "ArrowLeft", key: "ArrowLeft", keyCode: 37, type: "keyup" },
      // ProseMirror cancels the Escape keydown, which suppresses only the keypress.
      { code: "Escape", key: "Escape", keyCode: 27, type: "keydown" },
      { code: "Escape", key: "Escape", keyCode: 27, type: "keyup" },
    ]);
  });

  const recordShifted = (): {
    events: Array<{
      charCode: number;
      code: string;
      key: string;
      keyCode: number;
      shiftKey: boolean;
      type: string;
    }>;
    plugin: Plugin;
  } => {
    const events: Array<{
      charCode: number;
      code: string;
      key: string;
      keyCode: number;
      shiftKey: boolean;
      type: string;
    }> = [];
    const record = (event: KeyboardEvent): false => {
      events.push({
        // eslint-disable-next-line @typescript-eslint/no-deprecated -- Testing the deprecated property
        charCode: event.charCode,
        code: event.code,
        key: event.key,
        // eslint-disable-next-line @typescript-eslint/no-deprecated -- Testing the deprecated property
        keyCode: event.keyCode,
        shiftKey: event.shiftKey,
        type: event.type,
      });
      return false;
    };

    return {
      events,
      plugin: new Plugin({
        props: {
          handleDOMEvents: {
            keypress: (_view, event) => record(event),
            keyup: (_view, event) => record(event),
          },
          handleKeyDown: (_view, event) => record(event),
        },
      }),
    };
  };

  // A browser reports the uppercase key with Shift held: `key` becomes "B", `code` and the
  // keydown/keyup keyCode stay the physical key's, and the keypress charCode is the code point
  // of "B" rather than "b".
  const shiftedBEvents = [
    {
      charCode: 0,
      code: "KeyB",
      key: "B",
      keyCode: 66,
      shiftKey: true,
      type: "keydown",
    },
    {
      charCode: 66,
      code: "KeyB",
      key: "B",
      keyCode: 66,
      shiftKey: true,
      type: "keypress",
    },
    {
      charCode: 0,
      code: "KeyB",
      key: "B",
      keyCode: 66,
      shiftKey: true,
      type: "keyup",
    },
  ];

  test("should report the uppercase key while Shift is held", () => {
    const { events, plugin } = recordShifted();
    const testEditor = new ProseMirrorTester(initialDoc, { plugins: [plugin] });
    testEditor.selectText("end");

    testEditor.insertText("b", { shiftKey: true });

    expect(events).toStrictEqual(shiftedBEvents);
  });

  test("should imply Shift when an uppercase letter is typed directly", () => {
    const { events, plugin } = recordShifted();
    const testEditor = new ProseMirrorTester(initialDoc, { plugins: [plugin] });
    testEditor.selectText("end");

    testEditor.insertText("B");

    expect(events).toStrictEqual(shiftedBEvents);
  });
});
