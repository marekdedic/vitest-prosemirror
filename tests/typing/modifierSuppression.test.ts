import { Plugin } from "prosemirror-state";
import { describe, expect, test } from "vitest";

import { ProseMirrorTester } from "../../src/index";
import { doc, p } from "../builders";

describe("modifier suppression", () => {
  const initialDoc = doc(p("foo"));

  test.each(["{Ctrl-b}", "{Meta-b}", "{Alt-b}"])(
    "should not type a character while a suppressing modifier is held (%s)",
    (chord) => {
      const testEditor = new ProseMirrorTester(initialDoc);
      testEditor.selectText("end");

      testEditor.insertText(chord);

      expect(testEditor.doc).toEqualProseMirrorNode(initialDoc);
    },
  );

  test("should type the uppercase letter while Shift is held", () => {
    const testEditor = new ProseMirrorTester(initialDoc);
    testEditor.selectText("end");

    testEditor.insertText("{Shift-b}");

    const expectedDoc = doc(p("fooB"));

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

    testEditor.insertText("{Ctrl-b}");

    expect(events).toStrictEqual(["keydown", "keyup"]);
  });
});
