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
import { keyIdentity } from "./utils/keyIdentity";

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
  "all" | "end" | "start" | { from: number; to: number } | Selection | number;

type UsableMutationRecord = Omit<
  MutationRecord,
  "addedNodes" | "removedNodes"
> & {
  addedNodes: Array<Node>;
  removedNodes: Array<Node>;
};

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
    mockRangeRects();

    this.view = new EditorView(element, {
      state,
    });
  }

  public insertText(text: string, modifiers?: KeyboardModifiers): void {
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
      this.view.dispatchEvent(keydownEvent);

      // A cancelled keydown suppresses the keypress and the typing, but not the keyup.
      if (!keydownEvent.defaultPrevented) {
        if (identity.charCode !== 0) {
          this.view.dispatchEvent(
            new KeyboardEvent("keypress", {
              ...eventInit,
              // Keypress reports the code point of the character, not the key's virtual code.
              charCode: identity.charCode,
              keyCode: identity.charCode,
            }),
          );
        }

        this.typeCharacter(keyToChar(key));
      }

      this.view.dispatchEvent(new KeyboardEvent("keyup", eventInit));
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
    if (selection === "end") {
      pos = this.doc.nodeSize - 2;
    } else if (selection !== "start") {
      pos = selection;
    }

    return TextSelection.near(this.doc.resolve(pos));
  }

  private typeCharacter(character: string): void {
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
        return;
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
  if (key === "Tab") {
    return "\t";
  }
  return key;
}

// ProseMirror measures the DOM when handling cursor motion keys, but jsdom has no rects for a Range.
// Zero-sized rects make those measurements inconclusive, which ProseMirror handles gracefully.
function mockRangeRects(): void {
  const zeroRect = (): DOMRect => new DOMRect(0, 0, 0, 0);
  const emptyRectList = (): DOMRectList => [] as unknown as DOMRectList;

  const rangePrototype = Range.prototype as Partial<Range>;
  if (typeof rangePrototype.getBoundingClientRect !== "function") {
    Range.prototype.getBoundingClientRect = zeroRect;
  }
  if (typeof rangePrototype.getClientRects !== "function") {
    Range.prototype.getClientRects = emptyRectList;
  }
}
