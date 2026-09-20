import type { EditorState } from "prosemirror-state";

import { isProseMirrorNode } from "./isProseMirrorNode";

// A structural check rather than `val instanceof EditorState`, which fails when
// the state comes from a different copy of prosemirror-state than this package's.
// The `storedMarks` key distinguishes a state from a bare `Node` (which has none),
// so the state and node snapshot serializers never capture the same value.
export const isEditorState = (val: unknown): val is EditorState => {
  if (typeof val !== "object" || val === null) {
    return false;
  }

  const state = val as Record<string, unknown>;

  return (
    isProseMirrorNode(state["doc"]) &&
    typeof state["selection"] === "object" &&
    state["selection"] !== null &&
    "storedMarks" in state
  );
};
