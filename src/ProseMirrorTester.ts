import type { Node, Schema } from "prosemirror-model";

import {
  AllSelection,
  EditorState,
  type Plugin,
  type Selection,
  TextSelection,
} from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Keyboard } from "test-keyboard";

interface Options {
  plugins: Array<Plugin>;
}

export type TesterSelection =
  | "all"
  | "end"
  | "start"
  | { from: number; to: number }
  | Selection
  | number;

export class ProseMirrorTester {
  public get doc(): Node {
    return this.view.state.doc;
  }

  public get schema(): Schema {
    return this.view.state.schema;
  }

  private readonly view: EditorView;

  public constructor(documentRoot: Node, options: Partial<Options> = {}) {
    if (typeof document === "undefined") {
      throw new Error("TODO");
    }

    const element = document.createElement("div");
    document.body.append(element);

    const state = EditorState.create({
      doc: documentRoot,
      plugins: options.plugins ?? [],
    });
    this.view = new EditorView(element, {
      state,
    });
  }

  public insertText(text: string): void {
    const keys = Keyboard.create({
      target: this.view.dom,
    }).start();

    let pos = this.view.state.selection.from;
    for (const character of text) {
      keys.char({ text: character, typing: true });

      if (
        this.view.someProp("handleTextInput", (f) =>
          f(this.view, pos, pos, character),
        ) === undefined
      ) {
        this.view.dispatch(this.view.state.tr.insertText(character, pos, pos));
      }
      pos = this.view.state.selection.anchor;
    }
    keys.end();
  }

  public selectText(selection: TesterSelection): void {
    this.view.dispatch(
      this.view.state.tr.setSelection(this.getSelection(selection)),
    );
  }

  public shortcut(text: string): void {
    Keyboard.create({
      batch: true,
      target: this.view.dom,
    })
      .start()
      .mod({ text })
      .forEach(({ event }) => {
        this.view.dispatchEvent(event);
      })
      .end();
  }

  private getSelection(selection: TesterSelection): Selection {
    if (selection === "all") {
      return new AllSelection(this.doc);
    }

    if (
      typeof selection === "object" &&
      "$anchor" in selection &&
      "$head" in selection
    ) {
      return selection;
    }

    if (
      typeof selection === "object" &&
      "from" in selection &&
      "to" in selection
    ) {
      return TextSelection.between(
        this.doc.resolve(selection.from),
        this.doc.resolve(selection.to),
      );
    }

    let pos = 0;
    if (selection === "start") {
      pos = 0;
    } else if (selection === "end") {
      pos = this.doc.nodeSize - 2;
    } else {
      pos = selection;
    }

    return TextSelection.near(this.doc.resolve(pos));
  }
}
