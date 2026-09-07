import {
  DOMParser,
  type ParseOptions,
  type Node as ProseMirrorNode,
  type Schema,
} from "prosemirror-model";

// The HTML parser only permits table-related elements inside a real table
// context, so assigning `<td>..</td>` to a detached element discards the tags
// and keeps only the text. This is the ancestor chain each such element needs
// to survive parsing, mirroring prosemirror-view's own private `wrapMap`.
const wrapMap: Record<string, Array<string>> = {
  caption: ["table"],
  col: ["table", "colgroup"],
  colgroup: ["table"],
  tbody: ["table"],
  td: ["table", "tbody", "tr"],
  tfoot: ["table"],
  th: ["table", "tbody", "tr"],
  thead: ["table"],
  tr: ["table", "tbody"],
};

export function parseHTML(
  html: string,
  schema: Schema,
  options?: ParseOptions,
): ProseMirrorNode {
  return DOMParser.fromSchema(schema).parse(readHTML(html), options);
}

// Wraps the HTML in the ancestors its first tag requires, parses it into a
// detached document, then unwraps back down to the intended element. Leading
// meta tags are discarded.
function readHTML(rawHtml: string): HTMLElement {
  const metas = /^(\s*<meta [^>]*>)*/u.exec(rawHtml);
  const stripped = metas ? rawHtml.slice(metas[0].length) : rawHtml;

  const firstTag = /<([a-z][^>\s]+)/iu.exec(stripped);
  const wrap = firstTag ? wrapMap[firstTag[1].toLowerCase()] : undefined;
  const html =
    wrap === undefined
      ? stripped
      : wrap.map((n) => `<${n}>`).join("") +
        stripped +
        wrap
          .map((n) => `</${n}>`)
          .reverse()
          .join("");

  let elt: HTMLElement =
    document.implementation.createHTMLDocument("title").body;
  elt.innerHTML = html;
  if (wrap) {
    for (const n of wrap) {
      elt = elt.querySelector(n) ?? elt;
    }
  }
  return elt;
}
