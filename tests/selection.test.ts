import { describe, expect, test } from "vitest";

import { resolveSelection } from "../src/selection";
import { doc, p } from "./builders";

describe("resolveSelection", () => {
  const testDoc = doc(p("Hello World"));

  test("should preserve direction for a forward { anchor, head }", () => {
    const selection = resolveSelection(testDoc, { anchor: 3, head: 7 });

    expect(selection.anchor).toBe(3);
    expect(selection.head).toBe(7);
    expect(selection.from).toBe(3);
    expect(selection.to).toBe(7);
  });

  test("should preserve direction for a reversed { anchor, head }", () => {
    const selection = resolveSelection(testDoc, { anchor: 7, head: 3 });

    expect(selection.anchor).toBe(7);
    expect(selection.head).toBe(3);
    expect(selection.from).toBe(3);
    expect(selection.to).toBe(7);
  });

  test("should resolve a bare number to a cursor", () => {
    const selection = resolveSelection(testDoc, 4);

    expect(selection.empty).toBe(true);
    expect(selection.from).toBe(4);
  });

  describe("tag names", () => {
    test("should resolve a bare tag name to a cursor", () => {
      const taggedDoc = doc(p("foo<a>bar"));
      const selection = resolveSelection(taggedDoc, "a");

      expect(selection.empty).toBe(true);
      expect(selection.from).toBe(taggedDoc.tag["a"]);
    });

    test("should resolve tag names in { anchor, head }", () => {
      const taggedDoc = doc(p("foo<a>bar<b>baz"));
      const selection = resolveSelection(taggedDoc, { anchor: "a", head: "b" });

      expect(selection.from).toBe(taggedDoc.tag["a"]);
      expect(selection.to).toBe(taggedDoc.tag["b"]);
    });

    test("should mix a tag name and a number in { anchor, head }", () => {
      const taggedDoc = doc(p("foo<a>bar"));
      const selection = resolveSelection(taggedDoc, { anchor: "a", head: 7 });

      expect(selection.from).toBe(taggedDoc.tag["a"]);
      expect(selection.to).toBe(7);
    });

    test("should throw on an unknown bare tag name, listing the tags", () => {
      const taggedDoc = doc(p("foo<a>bar<b>baz"));

      expect(() => resolveSelection(taggedDoc, "typo")).toThrow(
        /no tag named "typo".*"a", "b"/su,
      );
    });

    test("should throw on an unknown tag in { anchor, head }", () => {
      const taggedDoc = doc(p("foo<a>bar"));

      expect(() =>
        resolveSelection(taggedDoc, { anchor: "a", head: "nope" }),
      ).toThrow(/no tag named "nope"/u);
    });

    test("should report no tags when the document has none", () => {
      expect(() => resolveSelection(testDoc, "missing")).toThrow(
        /no tag named "missing".*no tags/su,
      );
    });
  });

  describe("reserved literals vs tags", () => {
    test.each(["all", "start", "end"] as const)(
      "should keep %s behaviour when no tag shadows it",
      (literal) => {
        expect(() => resolveSelection(testDoc, literal)).not.toThrow();
      },
    );

    test.each(["all", "start", "end"] as const)(
      "should throw when %s is used as a bare string but also a tag",
      (literal) => {
        const taggedDoc = doc(p(`foo<${literal}>bar`));

        expect(() => resolveSelection(taggedDoc, literal)).toThrow(
          /both a reserved selection and a tag/u,
        );
      },
    );

    test("should allow a reserved-named tag referenced via { anchor, head }", () => {
      const taggedDoc = doc(p("foo<start>bar<end>baz"));
      const selection = resolveSelection(taggedDoc, {
        anchor: "start",
        head: "end",
      });

      expect(selection.from).toBe(taggedDoc.tag["start"]);
      expect(selection.to).toBe(taggedDoc.tag["end"]);
    });
  });
});
