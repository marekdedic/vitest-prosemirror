import type { Mark, Node } from "prosemirror-model";
import type { Selection } from "prosemirror-state";

import stringifyObject from "stringify-object";

import { stringifyObjectOptions } from "./stringifyMark";

type Markers = Map<number, string>;

export function stringifyProseMirrorNode(
  node: Node,
  selection?: Selection,
  indentation = "",
): string {
  const markers: Markers = new Map();

  if (selection !== undefined) {
    if (selection.anchor === selection.head) {
      markers.set(selection.anchor, "<cursor>");
    } else {
      markers.set(selection.anchor, "<anchor>");
      markers.set(selection.head, "<head>");
    }
  }

  return render(node, markers, indentation, 0);
}

function escapeText(text: string): string {
  return text.replace(/[\p{Cc}'\\]/gu, (char) => {
    switch (char) {
      case "\f":
        return "\\f";
      case "\n":
        return "\\n";
      case "\r":
        return "\\r";
      case "\t":
        return "\\t";
      case "\b":
        return "\\b";
      case "'":
        return "\\'";
      case "\\":
        return "\\\\";
      default:
        return `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`;
    }
  });
}

function quoteWithMarkers(
  text: string,
  start: number,
  markers: Markers,
): string {
  const inside = [...markers.entries()]
    .filter(([pos]) => pos >= start && pos <= start + text.length)
    .sort(([a], [b]) => a - b);

  let raw = text;
  for (const [pos, notation] of inside.reverse()) {
    markers.delete(pos);
    const offset = pos - start;
    raw = `${raw.slice(0, offset)}${notation}${raw.slice(offset)}`;
  }
  return `'${escapeText(raw)}'`;
}

// `contentStart` is the absolute document position of the start of `node`'s
// content (0 for the top-level node)
function render(
  node: Node,
  markers: Markers,
  indentation: string,
  contentStart: number,
): string {
  if (node.type.spec.toDebugString !== undefined) {
    return `${indentation}${wrapMarks(node.marks, node.type.spec.toDebugString(node))}`;
  }

  if (node.type.name === "text") {
    return `${indentation}${wrapMarks(node.marks, quoteWithMarkers(node.textContent, contentStart, markers))}`;
  }

  return renderElement(node, markers, indentation, contentStart);
}

// Renders a non-text node as `type(...)`. The arguments — an attrs object, the
// children, and any standalone selection markers — are collected as indented
// lines; whether the call collapses onto a single line is then decided from the
// node's shape (see `singleLine`).
function renderElement(
  node: Node,
  markers: Markers,
  indentation: string,
  contentStart: number,
): string {
  const type = node.type.name;
  const hasAttrs = Object.keys(node.attrs).length > 0;
  const nextIndentation = `${indentation}  `;
  const args: Array<string> = [];

  const pushArg = (content: string): void => {
    args.push(`${nextIndentation}${content},`);
  };
  const pushMarkerAt = (pos: number): void => {
    const notation = markers.get(pos);
    if (notation !== undefined) {
      markers.delete(pos);
      pushArg(`'${notation}'`);
    }
  };

  if (hasAttrs) {
    pushArg(stringifyObject(node.attrs, stringifyObjectOptions));
  }

  if (!node.type.isLeaf) {
    if (node.content.childCount === 0) {
      pushMarkerAt(contentStart);
    }
    node.content.forEach((child, offset, index) => {
      const childStart = contentStart + offset;
      const isText = child.type.name === "text";
      const prevIsText =
        index > 0 && node.content.child(index - 1).type.name === "text";

      if (!prevIsText && !isText) {
        pushMarkerAt(childStart);
      }

      if (isText) {
        pushArg(
          wrapMarks(
            child.marks,
            quoteWithMarkers(child.textContent, childStart, markers),
          ),
        );
      } else {
        args.push(
          `${render(child, markers, nextIndentation, childStart + 1)},`,
        );
      }
    });

    if (node.content.lastChild?.type.name !== "text") {
      pushMarkerAt(contentStart + node.content.size);
    }
  }

  // A node fits on one line when it has no attrs and its content is empty
  // (possibly holding a cursor) or a single text child — never a nested node.
  // The lone argument is then unwrapped from its indented, comma-suffixed form.
  const singleLine =
    !hasAttrs &&
    (node.content.childCount === 0 ||
      (node.content.childCount === 1 &&
        node.content.firstChild?.type.name === "text"));

  const body = singleLine
    ? `${type}(${args.map((arg) => arg.slice(nextIndentation.length, -1)).join("")})`
    : `${type}(\n${args.join("\n")}\n${indentation})`;

  return `${indentation}${wrapMarks(node.marks, body)}`;
}

function wrapMarks(marks: ReadonlyArray<Mark>, origContent: string): string {
  let content = origContent;

  for (const mark of [...marks].reverse()) {
    const hasAttrs = Object.keys(mark.attrs).length > 0;
    const items: Array<string> = [content];

    if (hasAttrs) {
      items.unshift(stringifyObject(mark.attrs, stringifyObjectOptions));
    }

    content = `${mark.type.name}(${items.join(", ")})`;
  }

  return content;
}
