import { AllSelection } from "prosemirror-state";
import { describe, expect, test } from "vitest";

import { renderProseMirror } from "../src/renderProseMirror";
import { doc, p } from "./builders";

describe("toHaveSelection", () => {
  test("should match a collapsed cursor given as a number", () => {
    expect.assertions(1);

    const t = renderProseMirror(doc(p("foobar")));
    t.setSelection(4);

    expect(t).toHaveSelection(4);
  });

  test("should match a range given as { anchor, head }", () => {
    expect.assertions(1);

    const t = renderProseMirror(doc(p("foobar")));
    t.setSelection({ anchor: 4, head: 7 });

    expect(t).toHaveSelection({ anchor: 4, head: 7 });
  });

  test('should match an AllSelection given as "all"', () => {
    expect.assertions(1);

    const t = renderProseMirror(doc(p("foobar")));
    t.setSelection("all");

    expect(t).toHaveSelection("all");
  });

  test("should match a prosemirror-test-builder tag name", () => {
    expect.assertions(1);

    const d = doc(p("foo<a>bar"));
    const t = renderProseMirror(d);
    t.setSelection("a");

    expect(t).toHaveSelection("a");
  });

  test("should accept an EditorState as the received value", () => {
    expect.assertions(1);

    const t = renderProseMirror(doc(p("foobar")));
    t.setSelection({ anchor: 4, head: 7 });

    expect(t.state).toHaveSelection({ anchor: 4, head: 7 });
  });

  test("should report a diff when the selection differs", () => {
    expect.assertions(4);

    const t = renderProseMirror(doc(p("foobar")));
    t.setSelection({ anchor: 4, head: 7 });

    expect(() => {
      expect(t).toHaveSelection({ anchor: 1, head: 2 });
    }).toThrow(/Expected selection to equal/u);

    expect(() => {
      expect(t).toHaveSelection({ anchor: 1, head: 2 });
    }).toThrow(/Difference/u);
  });

  test("should print both selections with their markers on a failure", () => {
    expect.assertions(4);

    const t = renderProseMirror(doc(p("foobar")));
    t.setSelection({ anchor: 4, head: 7 });

    // Received selection renders at positions 4/7, the expected one at 1/2.
    expect(() => {
      expect(t).toHaveSelection({ anchor: 1, head: 2 });
    }).toThrow(/paragraph\('foo<anchor>bar<head>'\)/u);

    expect(() => {
      expect(t).toHaveSelection({ anchor: 1, head: 2 });
    }).toThrow(/paragraph\('<anchor>f<head>oobar'\)/u);
  });

  test("should print a collapsed cursor as a single marker", () => {
    expect.assertions(4);

    const t = renderProseMirror(doc(p("foobar")));
    t.setSelection(4);

    // Received cursor at position 4, expected cursor at position 2.
    expect(() => {
      expect(t).toHaveSelection(2);
    }).toThrow(/paragraph\('foo<cursor>bar'\)/u);

    expect(() => {
      expect(t).toHaveSelection(2);
    }).toThrow(/paragraph\('f<cursor>oobar'\)/u);
  });

  test("should name both selection kinds when kinds differ", () => {
    expect.assertions(4);

    const d = doc(p("foobar"));
    const t = renderProseMirror(d);
    t.setSelection(new AllSelection(d));

    expect(() => {
      expect(t).toHaveSelection({ anchor: 1, head: 7 });
    }).toThrow(/AllSelection/u);

    expect(() => {
      expect(t).toHaveSelection({ anchor: 1, head: 7 });
    }).toThrow(/TextSelection/u);
  });

  test("should report a message when a matching selection was expected to differ", () => {
    expect.assertions(4);

    const t = renderProseMirror(doc(p("foobar")));
    t.setSelection({ anchor: 4, head: 7 });

    // The rejection prints the (matching) selection with its markers.
    expect(() => {
      expect(t).not.toHaveSelection({ anchor: 4, head: 7 });
    }).toThrow(/Expected selection to not equal/u);

    expect(() => {
      expect(t).not.toHaveSelection({ anchor: 4, head: 7 });
    }).toThrow(/paragraph\('foo<anchor>bar<head>'\)/u);
  });
});
