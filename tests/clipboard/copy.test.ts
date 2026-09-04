import { describe, expect, test } from "vitest";

import { ProseMirrorTester } from "../../src/index";
import { doc, p, strong } from "../builders";

describe("copy", () => {
  test("should serialise the selection to html and text", () => {
    const testEditor = new ProseMirrorTester(doc(p("hello ", strong("world"))));
    testEditor.selectText("all");

    const { html, text } = testEditor.copy();

    expect(html).toContain("<strong>world</strong>");
    expect(text).toBe("hello world");
  });

  test("should round-trip through paste", () => {
    const source = new ProseMirrorTester(doc(p("a", strong("b"))));
    source.selectText("all");
    const clipboard = source.copy();

    const target = new ProseMirrorTester(doc(p()));
    target.selectText("start");
    target.paste(clipboard);

    expect(target.doc).toEqualProseMirrorNode(doc(p("a", strong("b"))));
  });
});
