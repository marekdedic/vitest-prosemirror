import type { Node as ProseMirrorNode, Schema } from "prosemirror-model";

import { EditorState, type Plugin } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

import { mockRangeRects } from "./utils/mockRangeRects";
import { MutationObserverMock } from "./utils/MutationObserverMock";
import { resolveSelection, type TesterSelection } from "./utils/selection";
import { insertText, type KeyboardModifiers } from "./utils/typing";

export interface Options {
  plugins: Array<Plugin>;
}

export class ProseMirrorTester {
  public get doc(): ProseMirrorNode {
    return this.view.state.doc;
  }

  public get schema(): Schema {
    return this.view.state.schema;
  }

  private readonly view: EditorView;

  public constructor(
    documentRoot: ProseMirrorNode,
    options: Partial<Options> = {},
  ) {
    if (typeof document === "undefined") {
      throw new Error("TODO");
    }

    const element = document.createElement("div");
    document.body.append(element);

    const state = EditorState.create({
      doc: documentRoot,
      plugins: options.plugins ?? [],
    });

    global.MutationObserver = MutationObserverMock;
    mockRangeRects();

    this.view = new EditorView(element, {
      state,
    });
  }

  public insertText(text: string, modifiers?: KeyboardModifiers): void {
    insertText(this.view, text, modifiers);
  }

  public selectText(selection: TesterSelection): void {
    this.view.dispatch(
      this.view.state.tr.setSelection(resolveSelection(this.doc, selection)),
    );
  }
}
