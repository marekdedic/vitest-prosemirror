import type { EditorView, NodeView } from "prosemirror-view";

import {
  type DOMOutputSpec,
  type Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";
import { describe, expect, test, vi } from "vitest";

import { ProseMirrorTester } from "../src/index";

const schema = new Schema({
  nodes: {
    doc: { content: "todo+" },
    text: {},
    todo: {
      attrs: { checked: { default: false } },
      content: "text*",
      parseDOM: [{ tag: "div.todo" }],
      toDOM: (): DOMOutputSpec => ["div", { class: "todo" }, ["span", 0]],
    },
  },
});

class TodoView implements NodeView {
  public readonly contentDOM: HTMLElement;
  public readonly dom: HTMLElement;

  private readonly checkbox: HTMLInputElement;
  private node: ProseMirrorNode;

  public constructor(
    node: ProseMirrorNode,
    view: EditorView,
    getPos: () => number | undefined,
  ) {
    this.node = node;
    this.dom = document.createElement("div");
    this.dom.className = "todo";
    this.checkbox = document.createElement("input");
    this.checkbox.type = "checkbox";
    this.checkbox.checked = node.attrs["checked"] as boolean;
    this.checkbox.addEventListener("click", () => {
      const pos = getPos();
      if (pos === undefined) {
        return;
      }
      view.dispatch(
        view.state.tr.setNodeAttribute(
          pos,
          "checked",
          !(this.node.attrs["checked"] as boolean),
        ),
      );
    });
    this.contentDOM = document.createElement("span");
    this.dom.append(this.checkbox, this.contentDOM);
  }

  public destroy(): void {
    this.checkbox.remove();
  }

  public update(node: ProseMirrorNode): boolean {
    if (node.type !== this.node.type) {
      return false;
    }
    this.node = node;
    this.checkbox.checked = node.attrs["checked"] as boolean;
    return true;
  }
}

const nodeViews = {
  todo: (
    node: ProseMirrorNode,
    view: EditorView,
    getPos: () => number | undefined,
  ): TodoView => new TodoView(node, view, getPos),
};

const makeDoc = (): ProseMirrorNode =>
  schema.node("doc", null, [
    schema.node("todo", { checked: true }, schema.text("Hello")),
    schema.node("todo", { checked: false }, schema.text("World")),
  ]);

describe("node views", () => {
  test("ProseMirror builds the node views with a real getPos", () => {
    const testEditor = new ProseMirrorTester(makeDoc(), { nodeViews });

    const boxes = testEditor.elements('input[type="checkbox"]');

    expect(boxes).toHaveLength(2);

    // Clicking the *second* checkbox only toggles the second todo if getPos is
    // real -- hand-constructed node views cannot reach this.
    testEditor.click(boxes[1]);

    expect(testEditor.state.doc.child(0).attrs["checked"]).toBe(true);
    expect(testEditor.state.doc.child(1).attrs["checked"]).toBe(true);
  });

  test("update() runs when the document changes", () => {
    const updateSpy = vi.spyOn(TodoView.prototype, "update");
    const testEditor = new ProseMirrorTester(makeDoc(), { nodeViews });

    updateSpy.mockClear();
    testEditor.selectText("start");
    testEditor.insertText("x");

    // eslint-disable-next-line vitest/prefer-called-with -- We assert that update ran at all; ProseMirror controls the exact node argument.
    expect(updateSpy).toHaveBeenCalled();
    expect(testEditor.state.doc.child(0).textContent).toBe("xHello");

    updateSpy.mockRestore();
  });

  test("destroy() runs when the tester is destroyed", () => {
    const destroySpy = vi.spyOn(TodoView.prototype, "destroy");
    const testEditor = new ProseMirrorTester(makeDoc(), { nodeViews });

    testEditor.destroy();

    // eslint-disable-next-line vitest/prefer-called-with -- destroy takes no arguments.
    expect(destroySpy).toHaveBeenCalled();

    destroySpy.mockRestore();
  });
});

describe("other EditorProps", () => {
  test("editable: () => false renders a non-editable editor", () => {
    new ProseMirrorTester(makeDoc(), { editable: (): false => false });

    const editor = document.body.querySelector(".ProseMirror");

    expect(editor?.getAttribute("contenteditable")).toBe("false");
  });

  test("attributes are applied to the editor DOM", () => {
    new ProseMirrorTester(makeDoc(), {
      attributes: { "aria-label": "My editor", class: "custom-editor" },
    });

    const editor = document.body.querySelector(".ProseMirror");

    expect(editor?.classList.contains("custom-editor")).toBe(true);
    expect(editor?.getAttribute("aria-label")).toBe("My editor");
  });
});
