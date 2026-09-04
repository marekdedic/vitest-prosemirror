import type { EditorView } from "prosemirror-view";

import { Fragment, Node as ProseMirrorNode, Slice } from "prosemirror-model";

import { keyIdentity } from "../typing/keyIdentity";
import { ClipboardEventMock } from "./ClipboardEventMock";
import { DataTransferMock } from "./DataTransferMock";

export interface PasteContent {
  html?: string;
  plainText?: boolean;
  text?: string;
}

export type PasteInput = PasteContent | ProseMirrorNode | string;

const dispatchShift = (view: EditorView, type: "keydown" | "keyup"): void => {
  const identity = keyIdentity("Shift");
  view.dispatchEvent(
    new KeyboardEvent(type, {
      bubbles: true,
      cancelable: true,
      code: identity.code,
      composed: true,
      key: identity.key,
      keyCode: identity.keyCode,
      location: identity.location,
      shiftKey: true,
    }),
  );
};

const normalize = (view: EditorView, content: PasteInput): PasteContent => {
  if (typeof content === "string") {
    return { text: content };
  }
  if (content instanceof ProseMirrorNode) {
    const { dom, text } = view.serializeForClipboard(
      new Slice(Fragment.from(content), 0, 0),
    );
    return { html: dom.innerHTML, text };
  }
  return content;
};

// Dispatches a real paste event through view.dom, exercising the full browser path.
export const paste = (view: EditorView, content: PasteInput): void => {
  const { html, plainText, text } = normalize(view, content);

  const data = new DataTransferMock();
  if (text !== undefined) {
    data.setData("text/plain", text);
  }
  if (html !== undefined) {
    data.setData("text/html", html);
  }

  if (plainText === true) {
    dispatchShift(view, "keydown");
  }

  view.dom.dispatchEvent(new ClipboardEventMock("paste", data));

  if (plainText === true) {
    dispatchShift(view, "keyup");
  }
};
