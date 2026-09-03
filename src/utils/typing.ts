import type { EditorView } from "prosemirror-view";

import { Selection } from "prosemirror-state";

import { characterDataAt } from "./dom";
import { tokenizeKeyboardInput } from "./keyboardInput";
import { parseKeyChord } from "./keyChord";
import { keyIdentity } from "./keyIdentity";
import { MutationObserverMock } from "./MutationObserverMock";

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

// A browser produces no character when Ctrl, Meta or Alt is held.
const suppressesCharacter = (modifiers?: KeyboardModifiers): boolean =>
  modifiers?.altKey === true ||
  modifiers?.ctrlKey === true ||
  modifiers?.metaKey === true;

const isLetter = (key: string): boolean => /^[a-z]$/iu.test(key);

export function insertText(view: EditorView, text: string): void {
  for (const token of tokenizeKeyboardInput(text)) {
    const { key, modifiers } = parseKeyChord(token);
    const character =
      isLetter(key) && modifiers.shiftKey === true ? key.toUpperCase() : key;
    const shiftKey = isLetter(character)
      ? character === character.toUpperCase()
      : (modifiers.shiftKey ?? false);
    const identity = keyIdentity(character);
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
      shiftKey,
    };

    const keydownEvent = new KeyboardEvent("keydown", eventInit);
    view.dispatchEvent(keydownEvent);

    // A cancelled keydown suppresses the keypress and the typing, but not the keyup.
    if (!keydownEvent.defaultPrevented) {
      const action = keyAction(character, modifiers);
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
    if (suppressesCharacter(modifiers)) {
      return { type: "ignore" };
    }
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

// Edits the DOM the way a browser would and reports the resulting mutation, so that
// ProseMirror's DOM observer picks the change up through its real input path.
function typeCharacter(view: EditorView, character: string): void {
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
