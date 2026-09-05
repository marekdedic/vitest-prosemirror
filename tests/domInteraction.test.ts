import type { EditorView, NodeView } from "prosemirror-view";

import {
  type DOMOutputSpec,
  type Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";
import { describe, expect, test } from "vitest";

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
    this.checkbox.addEventListener("click", (event) => {
      const pos = getPos();
      if (pos === undefined) {
        return;
      }
      event.preventDefault();
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
    schema.node("todo", { checked: false }, schema.text("Hello")),
    schema.node("todo", { checked: false }, schema.text("World")),
  ]);

describe("element()", () => {
  test("returns the matching element", () => {
    const testEditor = new ProseMirrorTester(makeDoc(), { nodeViews });

    const el = testEditor.element("div.todo");

    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.classList.contains("todo")).toBe(true);
  });

  test("throws naming the selector on a miss", () => {
    const testEditor = new ProseMirrorTester(makeDoc(), { nodeViews });

    expect(() => testEditor.element("div.missing")).toThrow("div.missing");
  });
});

describe("elements()", () => {
  test("returns an array of all matches", () => {
    const testEditor = new ProseMirrorTester(makeDoc(), { nodeViews });

    const boxes = testEditor.elements('input[type="checkbox"]');

    expect(Array.isArray(boxes)).toBe(true);
    expect(boxes).toHaveLength(2);
  });

  test("returns an empty array when nothing matches", () => {
    const testEditor = new ProseMirrorTester(makeDoc(), { nodeViews });

    expect(testEditor.elements("span.missing")).toHaveLength(0);
  });
});

describe("click()", () => {
  test("clicking the second checkbox toggles only the second item", () => {
    const testEditor = new ProseMirrorTester(makeDoc(), { nodeViews });

    const boxes = testEditor.elements('input[type="checkbox"]');
    testEditor.click(boxes[1]);

    expect(testEditor.state.doc.child(0).attrs["checked"]).toBe(false);
    expect(testEditor.state.doc.child(1).attrs["checked"]).toBe(true);
  });

  test("returns whether the default was prevented", () => {
    const testEditor = new ProseMirrorTester(makeDoc(), { nodeViews });

    expect(testEditor.click('input[type="checkbox"]')).toBe(true);
  });

  test("accepts a selector as well as an element", () => {
    const testEditor = new ProseMirrorTester(makeDoc(), { nodeViews });

    testEditor.click('input[type="checkbox"]');

    expect(testEditor.state.doc.child(0).attrs["checked"]).toBe(true);
  });

  test("propagates to handleDOMEvents on view.dom", () => {
    let clicked = false;
    const testEditor = new ProseMirrorTester(makeDoc(), {
      handleDOMEvents: {
        click: (): boolean => {
          clicked = true;
          return false;
        },
      },
      nodeViews,
    });

    testEditor.click('input[type="checkbox"]');

    expect(clicked).toBe(true);
  });

  test("clicking a detached element hits the getPos() === undefined guard", () => {
    const testEditor = new ProseMirrorTester(makeDoc(), { nodeViews });

    const box = testEditor.elements('input[type="checkbox"]')[0];

    testEditor.command((state, dispatch) => {
      dispatch?.(state.tr.delete(0, state.doc.child(0).nodeSize));
      return true;
    });

    expect(box.isConnected).toBe(false);

    expect(testEditor.click(box)).toBe(false);
    expect(testEditor.state.doc.childCount).toBe(1);
    expect(testEditor.state.doc.child(0).attrs["checked"]).toBe(false);
  });

  test("throws when a handleClick prop is configured", () => {
    const testEditor = new ProseMirrorTester(makeDoc(), {
      handleClick: (): boolean => false,
      nodeViews,
    });

    expect(() => testEditor.click('input[type="checkbox"]')).toThrow(
      "posAtCoords",
    );
  });
});
