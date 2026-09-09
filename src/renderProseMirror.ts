import type { Node as ProseMirrorNode } from "prosemirror-model";

import { type Command, EditorState } from "prosemirror-state";
import { type DirectEditorProps, EditorView } from "prosemirror-view";

import type { ProseMirrorEditor } from "./ProseMirrorEditor";

import { type Clipboard, copy } from "./clipboard/copy";
import { paste, type PasteInput } from "./clipboard/paste";
import { click, element, elements } from "./domInteraction";
import { mockRangeRects } from "./mockRangeRects";
import { MutationObserverMock } from "./MutationObserverMock";
import { resolveSelection, type TesterSelection } from "./selection";
import { type } from "./typing/typing";

export interface Options extends Omit<
  DirectEditorProps,
  "dispatchTransaction" | "state"
> {
  autoCleanup: boolean;
}

const originalMutationObserver = global.MutationObserver;
// All undestroyed editors, driving the MutationObserver refcount.
const liveEditors = new Set<ProseMirrorEditorImpl>();
// The subset the afterEach hook destroys -- opt-out editors stay out of it.
const autoCleanupEditors = new Set<ProseMirrorEditorImpl>();

export const cleanupEditors = (): void => {
  for (const editor of [...autoCleanupEditors]) {
    editor.destroy();
  }
};

export class ProseMirrorEditorImpl implements ProseMirrorEditor {
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
  private readonly mountPoint: HTMLElement;
  private readonly view: EditorView;

  public constructor(
    documentRoot: ProseMirrorNode,
    options: Partial<Options> = {},
  ) {
    if (typeof document === "undefined") {
      throw new Error("TODO");
    }

    this.mountPoint = document.createElement("div");
    document.body.append(this.mountPoint);

    const { autoCleanup = true, plugins = [], ...editorProps } = options;

    const state = EditorState.create({
      doc: documentRoot,
      plugins,
    });

    global.MutationObserver = MutationObserverMock;
    mockRangeRects();

    this.view = new EditorView(this.mountPoint, {
      state,
      ...editorProps,
    });

    liveEditors.add(this);
    if (autoCleanup) {
      autoCleanupEditors.add(this);
    }
  }

  public click(target: Element | string): boolean {
    this.assertAlive();
    return click(this.view, target);
  }

  public command(command: Command): boolean {
    this.assertAlive();
    return command(
      this.view.state,
      this.view.dispatch.bind(this.view),
      this.view,
    );
  }

  public copy(): Clipboard {
    this.assertAlive();
    return copy(this.view);
  }

  public destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    this.view.destroy();
    this.mountPoint.remove();
    document.getSelection()?.removeAllRanges();
    autoCleanupEditors.delete(this);
    liveEditors.delete(this);
    if (liveEditors.size === 0) {
      global.MutationObserver = originalMutationObserver;
    }
  }

  public element(selector: string): HTMLElement {
    this.assertAlive();
    return element(this.view, selector);
  }

  public elements(selector: string): Array<HTMLElement> {
    this.assertAlive();
    return elements(this.view, selector);
  }

  public paste(content: PasteInput): void {
    this.assertAlive();
    paste(this.view, content);
  }

  public setSelection(selection: TesterSelection): void {
    this.assertAlive();
    this.view.dispatch(
      this.view.state.tr.setSelection(resolveSelection(this.doc, selection)),
    );
  }

  public type(text: string): void {
    this.assertAlive();
    type(this.view, text);
  }

  private assertAlive(): void {
    if (this.destroyed) {
      throw new Error(
        "This ProseMirror editor has been destroyed. Editors are destroyed automatically after each test; pass { autoCleanup: false } to keep one alive (e.g. across a beforeAll).",
      );
    }
  }
}

/**
 * Mount a ProseMirror `EditorView` on a jsdom node and return a
 * {@link ProseMirrorEditor} handle for driving it. Installs the mocks the
 * tester relies on (`MutationObserver`, range rects) and registers the editor
 * for automatic cleanup after each test unless `autoCleanup: false` is passed.
 */
export const renderProseMirror = (
  documentRoot: ProseMirrorNode,
  options: Partial<Options> = {},
): ProseMirrorEditor => new ProseMirrorEditorImpl(documentRoot, options);
