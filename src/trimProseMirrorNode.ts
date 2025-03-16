import { Fragment, type Node } from "prosemirror-model";

export function trimProseMirrorNode(node: Node): Node {
  let start = 0;
  let end = node.children.length;
  for (const child of node.children) {
    if (
      child.type.name === "paragraph" &&
      ["", "\n"].includes(child.textContent)
    ) {
      start++;
    } else {
      break;
    }
  }
  for (const child of node.children.slice().reverse()) {
    if (
      child.type.name === "paragraph" &&
      ["", "\n"].includes(child.textContent)
    ) {
      end--;
    } else {
      break;
    }
  }
  return node.copy(Fragment.from(node.children.slice(start, end)));
}
