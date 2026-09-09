import { Plugin } from "prosemirror-state";
import { describe, expect, test } from "vitest";

import { renderProseMirror } from "../../src/index";
import { doc, p } from "../builders";

describe("modifier suppression", () => {
  const initialDoc = doc(p("foo"));

  test.each(["{Ctrl-b}", "{Meta-b}", "{Alt-b}"])(
    "should not type a character while a suppressing modifier is held (%s)",
    (chord) => {
      const testEditor = renderProseMirror(initialDoc);
      testEditor.setSelection("end");

      testEditor.type(chord);

      expect(testEditor.doc).toEqualProseMirrorNode(initialDoc);
    },
  );

  test("should type the uppercase letter while Shift is held", () => {
    const testEditor = renderProseMirror(initialDoc);
    testEditor.setSelection("end");

    testEditor.type("{Shift-b}");

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
    const testEditor = renderProseMirror(initialDoc, { plugins: [plugin] });
    testEditor.setSelection("end");

    testEditor.type("{Ctrl-b}");

    expect(events).toStrictEqual(["keydown", "keyup"]);
  });
});
