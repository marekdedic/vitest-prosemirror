import { baseKeymap } from "prosemirror-commands";
import { keymap } from "prosemirror-keymap";
import { schema as basicSchema } from "prosemirror-schema-basic";
import { Plugin } from "prosemirror-state";
import { describe, expect, test } from "vitest";

import { ProseMirrorTester } from "../../src/index";

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

    // Named keys produce no character, so they fire no keypress (their keyCode/code
    // identities are covered exhaustively in keyIdentity's own tests).
    expect(events.map(({ key, type }) => ({ key, type }))).toStrictEqual([
      { key: "Backspace", type: "keydown" },
      { key: "Backspace", type: "keyup" },
      { key: "ArrowLeft", type: "keydown" },
      { key: "ArrowLeft", type: "keyup" },
      // ProseMirror cancels the Escape keydown, which suppresses only the keypress.
      { key: "Escape", type: "keydown" },
      { key: "Escape", type: "keyup" },
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

    testEditor.insertText("{Shift-b}");

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
