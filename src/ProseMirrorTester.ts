import type { Node as ProseMirrorNode, Schema } from "prosemirror-model";

import {
  AllSelection,
  EditorState,
  type Plugin,
  type Selection,
  TextSelection,
} from "prosemirror-state";
import { EditorView } from "prosemirror-view";

import { tokenizeKeyboardInput } from "./utils/keyboardInput";

export interface KeyboardModifiers {
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
}

export interface Options {
  plugins: Array<Plugin>;
}

export type TesterSelection =
  | "all"
  | "end"
  | "start"
  | { from: number; to: number }
  | Selection
  | number;

type UsableMutationRecord = Omit<
  MutationRecord,
  "addedNodes" | "removedNodes"
> & {
  addedNodes: Array<Node>;
  removedNodes: Array<Node>;
};

class KeyboardEventMock extends KeyboardEvent {
  private readonly onPreventDefault: () => void;

  public constructor(
    onPreventDefault: () => void,
    type: string,
    eventInitDict?: KeyboardEventInit,
  ) {
    super(type, eventInitDict);
    this.onPreventDefault = onPreventDefault;
  }
  public override preventDefault(): void {
    super.preventDefault();
    this.onPreventDefault();
  }
}

class MutationObserverMock {
  private static readonly activeObservers: Map<Node, MutationObserverMock> =
    new Map<Node, MutationObserverMock>();

  private readonly callback: MutationCallback;
  private target: Node | undefined;

  public constructor(callback: MutationCallback) {
    this.callback = callback;
    this.target = undefined;
  }

  public static createMutation(
    target: Node,
    mutationRecords: Array<UsableMutationRecord>,
  ): void {
    const observer = MutationObserverMock.activeObservers.get(target);
    if (observer === undefined) {
      return;
    }
    observer.callback(
      mutationRecords as unknown as Array<MutationRecord>,
      observer,
    );
  }

  public disconnect(): void {
    if (this.target !== undefined) {
      MutationObserverMock.activeObservers.delete(this.target);
    }
    this.target = undefined;
  }

  public observe(target: Node): void {
    this.target = target;
    MutationObserverMock.activeObservers.set(target, this);
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this -- Mocking another method
  public takeRecords(): Array<MutationRecord> {
    return [];
  }
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

    this.view = new EditorView(element, {
      state,
    });
  }

  public insertText(text: string, modifiers?: KeyboardModifiers): void {
    for (const key of tokenizeKeyboardInput(text)) {
      const character = keyToChar(key);

      let keydownPrevented = false;
      this.view.dispatchEvent(
        new KeyboardEventMock(
          () => {
            keydownPrevented = true;
          },
          "keydown",
          {
            bubbles: true,
            charCode: character.charCodeAt(0),
            key,
            ...modifiers,
          },
        ),
      );

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- False positive due to the value being set in a callback
      if (keydownPrevented) {
        continue;
      }

      this.view.dispatchEvent(
        new KeyboardEvent("keypress", {
          bubbles: true,
          charCode: character.charCodeAt(0),
          key,
          keyCode: character.charCodeAt(0),
          ...modifiers,
        }),
      );

      const domNode = this.view.domAtPos(this.view.state.selection.from).node;
      if (
        domNode.childNodes.length === 1 &&
        domNode.firstChild instanceof HTMLBRElement &&
        domNode.firstChild.classList.contains("ProseMirror-trailingBreak")
      ) {
        const brNode = domNode.firstChild;
        const textNode = new Text(character);
        domNode.removeChild(brNode);
        domNode.appendChild(textNode);
        MutationObserverMock.createMutation(this.view.dom, [
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
          continue;
        }
        const oldValue = target.data;
        const domOffset =
          this.view.state.selection.from - this.view.posAtDOM(target, 0);
        target.data =
          target.data.slice(0, domOffset) +
          character +
          target.data.slice(domOffset);
        MutationObserverMock.createMutation(this.view.dom, [
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

      this.view.dispatchEvent(
        new KeyboardEvent("keyup", {
          bubbles: true,
          charCode: character.charCodeAt(0),
          key,
          keyCode: character.charCodeAt(0),
          ...modifiers,
        }),
      );
    }
  }

  public selectText(selection: TesterSelection): void {
    this.view.dispatch(
      this.view.state.tr.setSelection(this.getSelection(selection)),
    );
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

function findLastCharacterDataNode(node: Node): CharacterData | null {
  if (node instanceof CharacterData) {
    return node;
  }
  for (const child of Array.from(node.childNodes).reverse()) {
    const textNode = findLastCharacterDataNode(child);
    if (textNode !== null) {
      return textNode;
    }
  }
  return null;
}

function keyToChar(key: string): string {
  if (key === "Enter") {
    return "\n";
  }
  if (key === "Tab") {
    return "\t";
  }
  return key;
}
