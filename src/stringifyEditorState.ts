import type { EditorState } from "prosemirror-state";

import {
  stringifyMark,
  stringifyProseMirrorNode,
} from "./stringifyProseMirrorNode";

export function stringifyEditorState(
  state: EditorState,
  indentation = "",
): string {
  const { doc, selection, storedMarks } = state;

  const lines = [
    stringifyProseMirrorNode(doc, selection, indentation),
    `${indentation}# selection: ${selection.constructor.name} ${String(selection.from)}..${String(selection.to)}`,
  ];

  if (storedMarks !== null) {
    lines.push(
      `${indentation}# storedMarks: [${storedMarks.map(stringifyMark).join(", ")}]`,
    );
  }

  return lines.join("\n");
}
