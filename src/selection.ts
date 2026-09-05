import type { Node as ProseMirrorNode } from "prosemirror-model";

import { AllSelection, type Selection, TextSelection } from "prosemirror-state";

export type TesterSelection =
  | "all"
  | "end"
  | "start"
  | { anchor: number | string; head: number | string }
  // A prosemirror-test-builder tag name. The reserved literals above are kept
  // for documentation and autocompletion; `& {}` stops them collapsing away.
  | (string & {})
  | Selection
  | number;

// Prosemirror-test-builder records `<name>` marker positions on the node's
// `.tag` (and defines `Node.prototype.tag` as a shared empty object). A doc
// built any other way has no `.tag` at all, so default to an empty map.
const tagsOf = (doc: ProseMirrorNode): Record<string, number> =>
  (doc as unknown as { tag?: Record<string, number> }).tag ?? {};

const resolvePos = (doc: ProseMirrorNode, value: number | string): number => {
  if (typeof value === "number") {
    return value;
  }

  const tags = tagsOf(doc);
  if (value in tags) {
    return tags[value];
  }

  const available = Object.keys(tags);
  throw new Error(
    `selectText: no tag named "${value}" in the document. ${
      available.length > 0
        ? `Available tags: ${available.map((tag) => `"${tag}"`).join(", ")}.`
        : "The document has no tags."
    }`,
  );
};

export const resolveSelection = (
  doc: ProseMirrorNode,
  selection: TesterSelection,
): Selection => {
  if (
    typeof selection === "object" &&
    "$anchor" in selection &&
    "$head" in selection
  ) {
    return selection;
  }

  if (
    typeof selection === "object" &&
    "anchor" in selection &&
    "head" in selection
  ) {
    return TextSelection.between(
      doc.resolve(resolvePos(doc, selection.anchor)),
      doc.resolve(resolvePos(doc, selection.head)),
    );
  }

  if (
    typeof selection === "object" &&
    "from" in selection &&
    "to" in selection
  ) {
    throw new Error(
      "selectText no longer accepts { from, to } — use { anchor, head } instead. The values map directly: { from: a, to: b } becomes { anchor: a, head: b }.",
    );
  }

  if (typeof selection === "number") {
    return TextSelection.near(doc.resolve(selection));
  }

  // A bare string: a reserved literal, or a tag name.
  const tags = tagsOf(doc);
  if (["all", "end", "start"].includes(selection)) {
    if (selection in tags) {
      throw new Error(
        `selectText: "${selection}" is both a reserved selection and a tag in the document. Use { anchor, head } to select the tag, or rename the tag.`,
      );
    }

    if (selection === "all") {
      return new AllSelection(doc);
    }

    return TextSelection.near(
      doc.resolve(selection === "end" ? doc.nodeSize - 2 : 0),
    );
  }

  return TextSelection.near(doc.resolve(resolvePos(doc, selection)));
};
