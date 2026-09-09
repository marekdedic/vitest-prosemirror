import type { Node as ProseMirrorNode } from "prosemirror-model";
import type { Command, EditorState } from "prosemirror-state";

import type { Clipboard } from "./clipboard/copy";
import type { PasteInput } from "./clipboard/paste";
import type { TesterSelection } from "./selection";

/**
 * The handle returned by `renderProseMirror`: a live editor mounted in jsdom,
 * exposing readers for its document and rendered DOM plus verbs that drive the
 * ProseMirror input path.
 */
export interface ProseMirrorEditor {
  /** Dispatch a click at the target selector or captured element. */
  click(target: Element | string): boolean;
  /** Run a ProseMirror command against the current state. */
  command(command: Command): boolean;
  /** Serialise the current selection the way the copy handler would. */
  copy(): Clipboard;
  /** Tear down the editor, its DOM node and the global mocks. */
  destroy(): void;

  /** The current document (`state.doc`). */
  readonly doc: ProseMirrorNode;
  /** The single element matching the selector. */
  element(selector: string): HTMLElement;
  /** Every element matching the selector. */
  elements(selector: string): Array<HTMLElement>;
  /** The rendered `innerHTML` of the editor DOM. */
  readonly html: string;
  /** Paste content through the DOM paste path. */
  paste(content: PasteInput): void;
  /** Set the selection from a {@link TesterSelection}. */
  setSelection(selection: TesterSelection): void;
  /** The current editor state. Live getter - reads the latest dispatch. */
  readonly state: EditorState;
  /** The rendered `textContent` of the editor DOM. */
  readonly text: string;
  /** Type key strings through the DOM input path. */
  type(text: string): void;
}
