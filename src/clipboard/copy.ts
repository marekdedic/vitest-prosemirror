import type { EditorView } from "prosemirror-view";

export interface Clipboard {
  html: string;
  text: string;
}

export const copy = (view: EditorView): Clipboard => {
  const { dom, text } = view.serializeForClipboard(
    view.state.selection.content(),
  );
  return { html: dom.innerHTML, text };
};
