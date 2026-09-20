import type { Node } from "prosemirror-model";

// A structural check rather than `val instanceof Node`, which fails when the
// document comes from a different copy of prosemirror-model than this package's.
export const isProseMirrorNode = (val: unknown): val is Node => {
  if (typeof val !== "object" || val === null) {
    return false;
  }

  const node = val as Record<string, unknown>;
  const type: unknown = node["type"];

  if (typeof type !== "object" || type === null) {
    return false;
  }

  const typeRecord = type as Record<string, unknown>;

  return (
    typeof typeRecord["name"] === "string" &&
    typeof typeRecord["schema"] === "object" &&
    "marks" in node &&
    "attrs" in node &&
    "content" in node
  );
};
