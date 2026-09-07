import blns from "blns";
import { DOMSerializer, type Node as ProseMirrorNode } from "prosemirror-model";
import { schema as basicSchema } from "prosemirror-schema-basic";
import { describe, expect, test } from "vitest";

import { parseHTML, ProseMirrorTester } from "../src/index";
import { stringifyProseMirrorNode } from "../src/stringifyProseMirrorNode";
import { doc, p } from "./builders";

const corpus = blns
  .filter((entry) => entry !== "")
  .map((entry, index) => [index, entry] as const);

describe("BLNS", () => {
  describe("stringifyProseMirrorNode", () => {
    test.each(corpus)(
      "entry %i round-trips through the debug serialiser",
      (_index, entry) => {
        const serialised = stringifyProseMirrorNode(basicSchema.text(entry));

        // eslint-disable-next-line no-new-func, @typescript-eslint/no-implied-eval -- re-evaluating escapeText's output should get the input
        const evaluate = new Function(`return ${serialised}`) as () => string;

        expect(evaluate()).toBe(entry);
      },
    );
  });

  // A copy-paste is not guaranteed to be a perfect fidelity round-trip -- the
  // DOM/schema may normalise some content -- but that normalisation must be
  // stable, so a second round-trip yields the same document as the first.
  describe("copy-paste", () => {
    const roundTrip = (document: ProseMirrorNode): ProseMirrorNode => {
      const source = new ProseMirrorTester(document);
      source.selectText("all");
      const clipboard = source.copy();

      const target = new ProseMirrorTester(doc(p()));
      target.selectText("start");
      target.paste(clipboard);
      return target.doc;
    };

    test.each(corpus)(
      "entry %i survives a stable round-trip",
      (_index, entry) => {
        const once = roundTrip(doc(p(entry)));

        expect(roundTrip(once)).toEqualProseMirrorNode(once);
      },
    );
  });

  // Naughty text must survive parseHTML without corruption. As above, parsing
  // may normalise, so the invariant is stability: re-serialising and re-parsing
  // a parsed document yields the same document.
  describe("parseHTML", () => {
    const serializer = DOMSerializer.fromSchema(basicSchema);

    const htmlOf = (node: ProseMirrorNode): string => {
      const container = window.document.createElement("div");
      container.appendChild(serializer.serializeFragment(node.content));
      return container.innerHTML;
    };

    const escapeHTML = (text: string): string => {
      const container = window.document.createElement("div");
      container.textContent = text;
      return container.innerHTML;
    };

    test.each(corpus)("entry %i parses stably", (_index, entry) => {
      const first = parseHTML(`<p>${escapeHTML(entry)}</p>`, basicSchema);

      expect(parseHTML(htmlOf(first), basicSchema)).toEqualProseMirrorNode(
        first,
      );
    });
  });
});
