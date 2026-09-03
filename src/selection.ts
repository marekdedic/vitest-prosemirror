import type { Node as ProseMirrorNode } from "prosemirror-model";

import { AllSelection, type Selection, TextSelection } from "prosemirror-state";

export type TesterSelection =
  | "all"
  | "end"
  | "start"
  | { anchor: number; head: number }
  | Selection
  | number;

export const resolveSelection = (
  doc: ProseMirrorNode,
  selection: TesterSelection,
): Selection => {
  if (selection === "all") {
    return new AllSelection(doc);
  }

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
      doc.resolve(selection.anchor),
      doc.resolve(selection.head),
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

  let pos = 0;
  if (selection === "end") {
    pos = doc.nodeSize - 2;
  } else if (selection !== "start") {
    pos = selection;
  }

  return TextSelection.near(doc.resolve(pos));
};
