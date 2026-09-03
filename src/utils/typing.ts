import type { EditorView } from "prosemirror-view";

import {
  backward,
  deleteText,
  forward,
  moveCaret,
  typeCharacter,
} from "./domEditing";
import { tokenizeKeyboardInput } from "./keyboardInput";
import { type KeyboardModifiers, parseKeyChord } from "./keyChord";
import { keyIdentity } from "./keyIdentity";

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
