import {
  baseKeymap,
  setBlockType,
  toggleMark,
  wrapIn,
} from "prosemirror-commands";
import { InputRule, inputRules } from "prosemirror-inputrules";
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
});
