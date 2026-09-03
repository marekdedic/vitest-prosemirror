import type { Node as ProseMirrorNode } from "prosemirror-model";

import { EditorState, type Plugin } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

import { mockRangeRects } from "./mockRangeRects";
import { MutationObserverMock } from "./MutationObserverMock";
import { resolveSelection, type TesterSelection } from "./selection";
import { insertText } from "./typing/typing";

export interface Options {
  autoCleanup: boolean;
  plugins: Array<Plugin>;
}

const originalMutationObserver = global.MutationObserver;
// All undestroyed testers, driving the MutationObserver refcount.
const liveTesters = new Set<ProseMirrorTester>();
// The subset the afterEach hook destroys -- opt-out testers stay out of it.
const autoCleanupTesters = new Set<ProseMirrorTester>();

export const cleanupTesters = (): void => {
  for (const tester of [...autoCleanupTesters]) {
    tester.destroy();
  }
};

export class ProseMirrorTester {
  public get doc(): ProseMirrorNode {
    this.assertAlive();
    return this.view.state.doc;
  }

  public get html(): string {
    this.assertAlive();
    return this.view.dom.innerHTML;
  }

  public get state(): EditorState {
    this.assertAlive();
    return this.view.state;
  }

  public get text(): string {
    this.assertAlive();
    return this.view.dom.textContent;
  }

  private destroyed = false;
  private readonly element: HTMLElement;
  private readonly view: EditorView;

  public constructor(
    documentRoot: ProseMirrorNode,
    options: Partial<Options> = {},
  ) {
    if (typeof document === "undefined") {
      throw new Error("TODO");
    }

    this.element = document.createElement("div");
    document.body.append(this.element);

    const state = EditorState.create({
      doc: documentRoot,
      plugins: options.plugins ?? [],
    });

    global.MutationObserver = MutationObserverMock;
    mockRangeRects();

    this.view = new EditorView(this.element, {
      state,
    });

    liveTesters.add(this);
    if (options.autoCleanup ?? true) {
      autoCleanupTesters.add(this);
    }
  }

  public destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    this.view.destroy();
    this.element.remove();
    document.getSelection()?.removeAllRanges();
    autoCleanupTesters.delete(this);
    liveTesters.delete(this);
    if (liveTesters.size === 0) {
      global.MutationObserver = originalMutationObserver;
    }
  }

  public insertText(text: string): void {
    this.assertAlive();
    insertText(this.view, text);
  }

  public selectText(selection: TesterSelection): void {
    this.assertAlive();
    this.view.dispatch(
      this.view.state.tr.setSelection(resolveSelection(this.doc, selection)),
    );
  }

  private assertAlive(): void {
    if (this.destroyed) {
      throw new Error(
        "This ProseMirrorTester has been destroyed. Testers are destroyed automatically after each test; pass { autoCleanup: false } to keep one alive (e.g. across a beforeAll).",
      );
    }
  }
}
