import type { EditorView } from "prosemirror-view";

import { Selection } from "prosemirror-state";

import { findLastCharacterDataNode } from "./dom";
import { tokenizeKeyboardInput } from "./keyboardInput";
import { keyIdentity } from "./keyIdentity";
import {
  MutationObserverMock,
  type UsableMutationRecord,
} from "./MutationObserverMock";

export interface KeyboardModifiers {
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
}

type KeyAction =
  | { character: string; type: "type" }
  | { direction: -1 | 1; type: "delete" }
  | { direction: -1 | 1; type: "moveCaret" }
  | { type: "ignore" };

const ignoredKeys = new Set([
  "Alt",
  "CapsLock",
  "Control",
  "Meta",
  "Shift",
  "Tab",
]);

const backward = -1;
const forward = 1;

const hasModifiers = (modifiers?: KeyboardModifiers): boolean =>
  modifiers !== undefined && Object.values(modifiers).includes(true);

export function insertText(
  view: EditorView,
  text: string,
  modifiers?: KeyboardModifiers,
): void {
  for (const key of tokenizeKeyboardInput(text)) {
    const identity = keyIdentity(key);
    // Only keypress carries a charCode, and browsers only fire it for keys producing a character.
    const eventInit = {
      bubbles: true,
      cancelable: true,
      charCode: 0,
      code: identity.code,
      composed: true,
      key: identity.key,
      keyCode: identity.keyCode,
      location: identity.location,
      ...modifiers,
    };

    const keydownEvent = new KeyboardEvent("keydown", eventInit);
    view.dispatchEvent(keydownEvent);

    // A cancelled keydown suppresses the keypress and the typing, but not the keyup.
    if (!keydownEvent.defaultPrevented) {
      const action = keyAction(key, modifiers);
      if (action.type === "delete") {
        deleteText(view, action.direction);
      } else if (action.type === "moveCaret") {
        moveCaret(view, action.direction);
      } else if (action.type === "type") {
        view.dispatchEvent(
          new KeyboardEvent("keypress", {
            ...eventInit,
            // Keypress reports the code point of the character, not the key's virtual code.
            charCode: identity.charCode,
            keyCode: identity.charCode,
          }),
        );
        typeCharacter(view, action.character);
      }
    }

    view.dispatchEvent(new KeyboardEvent("keyup", eventInit));
  }
}

function deleteText(view: EditorView, direction: -1 | 1): void {
  const { selection } = view.state;
  const from =
    selection.empty && direction === backward
      ? selection.from - 1
      : selection.from;
  const to =
    selection.empty && direction === forward ? selection.to + 1 : selection.to;

  const target = findLastCharacterDataNode(view.domAtPos(from).node);
  if (target === null) {
    throw new Error("Cannot simulate deleting from a node with no text");
  }
  const nodeStart = view.posAtDOM(target, 0);
  const fromOffset = from - nodeStart;
  const toOffset = to - nodeStart;
  if (fromOffset < 0 || toOffset > target.data.length) {
    throw new Error(
      "Cannot simulate deleting a range spanning multiple DOM nodes",
    );
  }

  const oldValue = target.data;
  target.data = target.data.slice(0, fromOffset) + target.data.slice(toOffset);
  MutationObserverMock.createMutation(view.dom, [
    mutation({ oldValue, target, type: "characterData" }),
  ]);
}

// What a browser would do with a keydown no handler cancelled. Keys whose native effect
// cannot be reproduced in jsdom throw rather than fall back to typing their own name.
function keyAction(key: string, modifiers?: KeyboardModifiers): KeyAction {
  if (ignoredKeys.has(key)) {
    return { type: "ignore" };
  }
  if (key === "Backspace") {
    return { direction: backward, type: "delete" };
  }
  if (key === "Delete") {
    return { direction: forward, type: "delete" };
  }
  // Vertical motion picks its target from the caret's x-coordinate, which the zero-sized
  // Range rects make unknowable, and the modified forms move by word or extend the selection.
  if (
    (key === "ArrowLeft" || key === "ArrowRight") &&
    !hasModifiers(modifiers)
  ) {
    return {
      direction: key === "ArrowLeft" ? backward : forward,
      type: "moveCaret",
    };
  }
  // Multi-character tokens are key names; anything else is the character it produces.
  if (key.length === 1) {
    return { character: key, type: "type" };
  }
  throw new Error(`Cannot simulate the "${key}" key`);
}

function moveCaret(view: EditorView, direction: -1 | 1): void {
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

function mutation(
  record: Partial<UsableMutationRecord> &
    Pick<UsableMutationRecord, "target" | "type">,
): UsableMutationRecord {
  return {
    addedNodes: [],
    attributeName: null,
    attributeNamespace: null,
    nextSibling: null,
    oldValue: null,
    previousSibling: null,
    removedNodes: [],
    ...record,
  };
}

// Edits the DOM the way a browser would and reports the resulting mutation, so that
// ProseMirror's DOM observer picks the change up through its real input path.
function typeCharacter(view: EditorView, character: string): void {
  const domNode = view.domAtPos(view.state.selection.from).node;
  // An empty textblock holds no text node to write into, only ProseMirror's placeholder
  // <br>, so the character replaces it.
  if (
    domNode.childNodes.length === 1 &&
    domNode.firstChild instanceof HTMLBRElement &&
    domNode.firstChild.classList.contains("ProseMirror-trailingBreak")
  ) {
    const brNode = domNode.firstChild;
    const textNode = new Text(character);
    domNode.removeChild(brNode);
    domNode.appendChild(textNode);
    MutationObserverMock.createMutation(view.dom, [
      mutation({
        addedNodes: [textNode],
        nextSibling: brNode,
        target: domNode,
        type: "childList",
      }),
      mutation({
        previousSibling: textNode,
        removedNodes: [brNode],
        target: domNode,
        type: "childList",
      }),
    ]);
  } else {
    const target = findLastCharacterDataNode(domNode);
    if (target === null) {
      return;
    }
    const oldValue = target.data;
    const domOffset = view.state.selection.from - view.posAtDOM(target, 0);
    target.data =
      target.data.slice(0, domOffset) +
      character +
      target.data.slice(domOffset);
    MutationObserverMock.createMutation(view.dom, [
      mutation({ oldValue, target, type: "characterData" }),
    ]);
  }
}
