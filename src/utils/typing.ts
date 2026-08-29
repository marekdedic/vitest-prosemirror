import type { EditorView } from "prosemirror-view";

import { findLastCharacterDataNode } from "./dom";
import { tokenizeKeyboardInput } from "./keyboardInput";
import { keyIdentity } from "./keyIdentity";
import { MutationObserverMock } from "./MutationObserverMock";

export interface KeyboardModifiers {
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
}

const keyToChar = (key: string): string => {
  if (key === "Tab") {
    return "\t";
  }
  return key;
};

// Edits the DOM the way a browser would and reports the resulting mutation, so that
// ProseMirror's DOM observer picks the change up through its real input path.
const typeCharacter = (view: EditorView, character: string): void => {
  const domNode = view.domAtPos(view.state.selection.from).node;
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
      {
        addedNodes: [textNode],
        attributeName: null,
        attributeNamespace: null,
        nextSibling: brNode,
        oldValue: null,
        previousSibling: null,
        removedNodes: [],
        target: domNode,
        type: "childList",
      },
      {
        addedNodes: [],
        attributeName: null,
        attributeNamespace: null,
        nextSibling: null,
        oldValue: null,
        previousSibling: textNode,
        removedNodes: [brNode],
        target: domNode,
        type: "childList",
      },
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
      {
        addedNodes: [],
        attributeName: null,
        attributeNamespace: null,
        nextSibling: null,
        oldValue,
        previousSibling: null,
        removedNodes: [],
        target,
        type: "characterData",
      },
    ]);
  }
};

export const insertText = (
  view: EditorView,
  text: string,
  modifiers?: KeyboardModifiers,
): void => {
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
      if (identity.charCode !== 0) {
        view.dispatchEvent(
          new KeyboardEvent("keypress", {
            ...eventInit,
            // Keypress reports the code point of the character, not the key's virtual code.
            charCode: identity.charCode,
            keyCode: identity.charCode,
          }),
        );
      }

      typeCharacter(view, keyToChar(key));
    }

    view.dispatchEvent(new KeyboardEvent("keyup", eventInit));
  }
};
