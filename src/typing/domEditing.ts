import type { EditorView } from "prosemirror-view";

import { Selection } from "prosemirror-state";

import { MutationObserverMock } from "../MutationObserverMock";
import { characterDataAt } from "./dom";

export const backward = -1;
export const forward = 1;

export function deleteText(view: EditorView, direction: -1 | 1): void {
  const { selection } = view.state;
  const from =
    selection.empty && direction === backward
      ? selection.from - 1
      : selection.from;
  const to =
    selection.empty && direction === forward ? selection.to + 1 : selection.to;

  // Asking for the DOM position on the left mirrors the browser, which puts the caret at
  // the end of the preceding text node rather than the start of the following one.
  const fromDOM = view.domAtPos(from, backward);
  const target = characterDataAt(fromDOM.node, fromDOM.offset)?.target;
  if (target === undefined) {
    throw new Error(
      "Cannot simulate deleting a range that is not inside a single text node",
    );
  }
  const nodeStart = view.posAtDOM(target, 0);
  const fromOffset = from - nodeStart;
  const toOffset = to - nodeStart;
  if (fromOffset < 0 || toOffset > target.data.length) {
    throw new Error(
      "Cannot simulate deleting a range that is not inside a single text node",
    );
  }

  const oldValue = target.data;
  target.data = target.data.slice(0, fromOffset) + target.data.slice(toOffset);
  MutationObserverMock.createMutation(view.dom, [
    { oldValue, target, type: "characterData" },
  ]);
}

export function moveCaret(view: EditorView, direction: -1 | 1): void {
  const { selection } = view.state;
  let pos = direction === backward ? selection.from : selection.to;
  if (selection.empty) {
    pos += direction;
  }
  view.dispatch(
    view.state.tr.setSelection(
      Selection.near(view.state.doc.resolve(pos), direction),
    ),
  );
}

// Edits the DOM the way a browser would and reports the resulting mutation, so that
// ProseMirror's DOM observer picks the change up through its real input path.
export function typeCharacter(view: EditorView, character: string): void {
  const { node, offset: domOffset } = view.domAtPos(
    view.state.selection.from,
    backward,
  );
  const point = characterDataAt(node, domOffset);
  if (point !== null) {
    const { offset, target } = point;
    const oldValue = target.data;
    target.data =
      target.data.slice(0, offset) + character + target.data.slice(offset);
    MutationObserverMock.createMutation(view.dom, [
      { oldValue, target, type: "characterData" },
    ]);
    return;
  }

  // There is no text node at the caret, so the browser creates one. ProseMirror's
  // trailing <br> placeholder, if the caret sits before one, is left in place -- it is
  // ignored when the change is read back and removed by the redraw that follows.
  const textNode = new Text(character);
  // .item() is null past the end of the list, where the character is simply appended.
  const nextSibling = node.childNodes.item(domOffset) as Node | null;
  node.insertBefore(textNode, nextSibling);
  MutationObserverMock.createMutation(view.dom, [
    {
      addedNodes: [textNode],
      nextSibling,
      previousSibling: textNode.previousSibling,
      target: node,
      type: "childList",
    },
  ]);
}
