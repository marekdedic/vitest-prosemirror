import { describe, expect, test } from "vitest";

import { renderProseMirror } from "../src/index";
import { doc, p } from "./builders";

const editorWhiteSpace = (): string => {
  const editor = document.body.querySelector(".ProseMirror");
  if (editor === null) {
    throw new Error("No editor is mounted");
  }
  return getComputedStyle(editor).whiteSpace;
};

// Before version 30, jsdom cascades stylesheets in insertion order rather than
// document order, so the prepended sheet beats an app sheet inserted before it.
const jsdomMajor = /jsdom\/(?<major>\d+)/u.exec(navigator.userAgent)?.groups?.[
  "major"
];
const staleCascade = jsdomMajor !== undefined && Number(jsdomMajor) < 30;

const styles = (): Array<HTMLStyleElement> => [
  ...document.head.querySelectorAll("style"),
];

describe("prosemirror-view stylesheet", () => {
  test("should set the white-space prosemirror-view expects", () => {
    renderProseMirror(doc(p("Hello")));

    expect(["normal", "nowrap", "pre-line"]).not.toContain(editorWhiteSpace());
  });

  test("should not warn when typing", () => {
    // The CSS check runs on the first DOM change; the console guard fails the
    // test on its warning.
    const testEditor = renderProseMirror(doc(p("Hello")));
    testEditor.setSelection("end");
    testEditor.type("!");

    expect(testEditor.text).toBe("Hello!");
  });

  test("should inject a single stylesheet first in the head", () => {
    const before = styles().length;
    renderProseMirror(doc(p("a")));
    renderProseMirror(doc(p("b")));

    expect(styles()).toHaveLength(before + 1);
    expect(document.head.firstElementChild?.textContent).toContain(
      ".ProseMirror",
    );
  });

  test.skipIf(staleCascade)(
    "should let the app's own stylesheets override it",
    () => {
      const own = document.createElement("style");
      own.textContent = ".ProseMirror { white-space: pre-wrap; }";
      document.head.append(own);
      renderProseMirror(doc(p("Hello")));

      expect(editorWhiteSpace()).toBe("pre-wrap");

      own.remove();
    },
  );

  test("should remove the stylesheet when the last editor is destroyed", () => {
    const before = styles().length;
    const first = renderProseMirror(doc(p("a")));
    const second = renderProseMirror(doc(p("b")));

    first.destroy();

    expect(styles()).toHaveLength(before + 1);

    second.destroy();

    expect(styles()).toHaveLength(before);
  });
});
