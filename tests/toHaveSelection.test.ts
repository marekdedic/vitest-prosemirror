import { AllSelection } from "prosemirror-state";
import { describe, expect, test } from "vitest";

import { ProseMirrorTester } from "../src/ProseMirrorTester";
import "../src/index";
import { doc, p } from "./builders";

describe("toHaveSelection", () => {
  test("should match a collapsed cursor given as a number", () => {
    expect.assertions(1);

    const t = new ProseMirrorTester(doc(p("foobar")));
    t.selectText(4);

    expect(t).toHaveSelection(4);
  });

  test("should match a range given as { anchor, head }", () => {
    expect.assertions(1);

    const t = new ProseMirrorTester(doc(p("foobar")));
    t.selectText({ anchor: 4, head: 7 });

    expect(t).toHaveSelection({ anchor: 4, head: 7 });
  });

  test('should match an AllSelection given as "all"', () => {
    expect.assertions(1);

    const t = new ProseMirrorTester(doc(p("foobar")));
    t.selectText("all");

    expect(t).toHaveSelection("all");
  });

  test("should match a prosemirror-test-builder tag name", () => {
    expect.assertions(1);

    const d = doc(p("foo<a>bar"));
    const t = new ProseMirrorTester(d);
    t.selectText("a");

    expect(t).toHaveSelection("a");
  });

  test("should accept an EditorState as the received value", () => {
    expect.assertions(1);

    const t = new ProseMirrorTester(doc(p("foobar")));
    t.selectText({ anchor: 4, head: 7 });

    expect(t.state).toHaveSelection({ anchor: 4, head: 7 });
  });

  test("should report a diff when the selection differs", () => {
    expect.assertions(4);

    const t = new ProseMirrorTester(doc(p("foobar")));
    t.selectText({ anchor: 4, head: 7 });

    expect(() => {
      expect(t).toHaveSelection({ anchor: 1, head: 2 });
    }).toThrow(/Expected selection to equal/u);

    expect(() => {
      expect(t).toHaveSelection({ anchor: 1, head: 2 });
    }).toThrow(/Difference/u);
  });

  test("should name both selection kinds when kinds differ", () => {
    expect.assertions(4);

    const d = doc(p("foobar"));
    const t = new ProseMirrorTester(d);
    t.selectText(new AllSelection(d));

    expect(() => {
      expect(t).toHaveSelection({ anchor: 1, head: 7 });
    }).toThrow(/AllSelection/u);

    expect(() => {
      expect(t).toHaveSelection({ anchor: 1, head: 7 });
    }).toThrow(/TextSelection/u);
  });

  test("should report a message when a matching selection was expected to differ", () => {
    expect.assertions(2);

    const t = new ProseMirrorTester(doc(p("foobar")));
    t.selectText({ anchor: 4, head: 7 });

    expect(() => {
      expect(t).not.toHaveSelection({ anchor: 4, head: 7 });
    }).toThrow(/Expected selection to not equal/u);
  });
});
