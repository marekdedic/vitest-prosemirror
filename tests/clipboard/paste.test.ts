import type { EditorView } from "prosemirror-view";

import { Plugin } from "prosemirror-state";
import { describe, expect, test, vi } from "vitest";

import { ProseMirrorTester } from "../../src/index";
import { doc, em, p, strong } from "../builders";

describe("paste", () => {
  test("should paste plain text at the selection", () => {
    const testEditor = new ProseMirrorTester(doc(p()));
    testEditor.selectText("start");

    testEditor.paste("hello");

    expect(testEditor.doc).toEqualProseMirrorNode(doc(p("hello")));
  });

  test("should parse pasted HTML into marks", () => {
    const testEditor = new ProseMirrorTester(doc(p()));
    testEditor.selectText("start");

    testEditor.paste({ html: "<p>a<strong>b</strong></p>" });

    expect(testEditor.doc).toEqualProseMirrorNode(doc(p("a", strong("b"))));
  });

  test("should prefer HTML when both flavours are present", () => {
    const testEditor = new ProseMirrorTester(doc(p()));
    testEditor.selectText("start");

    testEditor.paste({ html: "<p><em>rich</em></p>", text: "plain" });

    expect(testEditor.doc).toEqualProseMirrorNode(doc(p(em("rich"))));
  });

  test("should paste the plain-text flavour when plainText is set", () => {
    const testEditor = new ProseMirrorTester(doc(p()));
    testEditor.selectText("start");

    testEditor.paste({
      html: "<p><em>rich</em></p>",
      plainText: true,
      text: "plain",
    });

    expect(testEditor.doc).toEqualProseMirrorNode(doc(p("plain")));
  });

  test("should paste a ProseMirror node", () => {
    const testEditor = new ProseMirrorTester(doc(p()));
    testEditor.selectText("start");

    testEditor.paste(p("a", strong("b")));

    expect(testEditor.doc).toEqualProseMirrorNode(doc(p("a", strong("b"))));
  });

  test("should run handlePaste with the event and slice", () => {
    expect.hasAssertions();

    const handlePaste = vi.fn(
      (view: EditorView, event: ClipboardEvent): boolean => {
        expect(event.type).toBe("paste");
        expect(event.clipboardData?.getData("text/html")).toBe("<p>x</p>");

        view.dispatch(view.state.tr.insertText("intercepted"));
        return true;
      },
    );
    const testEditor = new ProseMirrorTester(doc(p()), { handlePaste });
    testEditor.selectText("start");

    testEditor.paste({ html: "<p>x</p>" });

    expect(handlePaste.mock.calls).toHaveLength(1);
    expect(testEditor.doc).toEqualProseMirrorNode(doc(p("intercepted")));
  });

  test("should apply transformPastedHTML", () => {
    const testEditor = new ProseMirrorTester(doc(p()), {
      transformPastedHTML: (html: string): string =>
        html.replace("world", "there"),
    });
    testEditor.selectText("start");

    testEditor.paste({ html: "<p>world</p>" });

    expect(testEditor.doc).toEqualProseMirrorNode(doc(p("there")));
  });

  test("should set the paste metadata on the transaction", () => {
    const metas: Array<unknown> = [];
    const recordMeta = new Plugin({
      filterTransaction: (tr): boolean => {
        metas.push(tr.getMeta("uiEvent"));
        return true;
      },
    });
    const testEditor = new ProseMirrorTester(doc(p()), {
      plugins: [recordMeta],
    });
    testEditor.selectText("start");

    testEditor.paste("hi");

    expect(metas).toContain("paste");
  });
});
