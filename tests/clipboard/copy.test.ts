import { describe, expect, test } from "vitest";

import { renderProseMirror } from "../../src/index";
import { doc, p, strong } from "../builders";

describe("copy", () => {
  test("should serialise the selection to html and text", () => {
    const testEditor = renderProseMirror(doc(p("hello ", strong("world"))));
    testEditor.setSelection("all");

    const { html, text } = testEditor.copy();

    expect(html).toContain("<strong>world</strong>");
    expect(text).toBe("hello world");
  });

  test("should round-trip through paste", () => {
    const source = renderProseMirror(doc(p("a", strong("b"))));
    source.setSelection("all");
    const clipboard = source.copy();

    const target = renderProseMirror(doc(p()));
    target.setSelection("start");
    target.paste(clipboard);

    expect(target.doc).toEqualProseMirrorNode(doc(p("a", strong("b"))));
  });
});
