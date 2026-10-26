import type { EditorView, NodeView } from "prosemirror-view";

import {
  type DOMOutputSpec,
  type Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";
import { Plugin } from "prosemirror-state";
import { describe, expect, test, vi } from "vitest";

import { renderProseMirror } from "../src/index";
import { doc, p } from "./builders";

const schema = new Schema({
  nodes: {
    doc: { content: "task+" },
    task: {
      content: "text*",
      parseDOM: [{ tag: "div.task" }],
      toDOM: (): DOMOutputSpec => ["div", { class: "task" }, ["span", 0]],
    },
    text: {},
  },
});

// Follows the editable prop through the contenteditable attribute ProseMirror keeps on
// view.dom, as a node view isn't updated when only that prop changes.
class TaskView implements NodeView {
  public readonly checkbox: HTMLInputElement;
  public readonly contentDOM: HTMLElement;
  public readonly dom: HTMLElement;

  private readonly editableObserver: MutationObserver;

  public constructor(view: EditorView) {
    this.dom = document.createElement("div");
    this.dom.className = "task";
    this.checkbox = document.createElement("input");
    this.checkbox.type = "checkbox";
    this.checkbox.disabled = !view.editable;
    this.contentDOM = document.createElement("span");
    this.dom.append(this.checkbox, this.contentDOM);
    this.editableObserver = new MutationObserver(() => {
      this.checkbox.disabled = !view.editable;
    });
    this.editableObserver.observe(view.dom, {
      attributeFilter: ["contenteditable"],
    });
  }

  public destroy(): void {
    this.editableObserver.disconnect();
  }
}

const nodeViews = {
  task: (_node: ProseMirrorNode, view: EditorView): TaskView =>
    new TaskView(view),
};

const makeTaskDoc = (): ProseMirrorNode =>
  schema.node("doc", null, [schema.node("task", null, schema.text("Hello"))]);

// Real observers deliver in a microtask; a macrotask lets every pending one run.
const settle = async (): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

const captureView = (
  editor: ReturnType<typeof renderProseMirror>,
): EditorView => {
  const captured: { view?: EditorView | undefined } = {};
  editor.command((_state, _dispatch, view) => {
    captured.view = view;
    return true;
  });
  if (captured.view === undefined) {
    throw new Error("The command received no view");
  }
  return captured.view;
};

describe("MutationObservers other than ProseMirror's", () => {
  test("a node view observer sees the editable prop change", async () => {
    expect.assertions(2);

    const testEditor = renderProseMirror(makeTaskDoc(), {
      editorProps: { editable: () => true, nodeViews },
    });
    const checkbox = testEditor.element(
      'input[type="checkbox"]',
    ) as HTMLInputElement;

    expect(checkbox.disabled).toBe(false);

    testEditor.command((_state, _dispatch, view) => {
      view?.setProps({ editable: () => false });
      return true;
    });
    await settle();

    expect(checkbox.disabled).toBe(true);
  });

  test("receive only the mutations their options ask for", async () => {
    expect.assertions(2);

    const testEditor = renderProseMirror(doc(p("Hello")));
    const view = captureView(testEditor);
    const attributeCallback = vi.fn<MutationCallback>();
    const characterDataCallback = vi.fn<MutationCallback>();
    new MutationObserver(attributeCallback).observe(view.dom, {
      attributeFilter: ["contenteditable"],
      subtree: true,
    });
    new MutationObserver(characterDataCallback).observe(view.dom, {
      characterData: true,
      subtree: true,
    });

    testEditor.setSelection("end");
    testEditor.type("x");
    await settle();

    expect(attributeCallback).not.toHaveBeenCalled();
    expect(characterDataCallback).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ type: "characterData" }),
      ]),
      expect.anything(),
    );
  });

  test("several observers share a target and disconnect independently", async () => {
    expect.assertions(5);

    const testEditor = renderProseMirror(doc(p("Hello")));
    const view = captureView(testEditor);
    const options = { characterData: true, childList: true, subtree: true };
    const firstCallback = vi.fn<MutationCallback>();
    const secondCallback = vi.fn<MutationCallback>();
    const first = new MutationObserver(firstCallback);
    first.observe(view.dom, options);
    new MutationObserver(secondCallback).observe(view.dom, options);

    testEditor.setSelection("end");
    testEditor.type("x");
    await settle();

    // eslint-disable-next-line vitest/prefer-called-with -- The records' contents are covered by the options test.
    expect(firstCallback).toHaveBeenCalled();
    // eslint-disable-next-line vitest/prefer-called-with -- The records' contents are covered by the options test.
    expect(secondCallback).toHaveBeenCalled();

    first.disconnect();
    firstCallback.mockClear();
    secondCallback.mockClear();
    testEditor.type("y");
    await settle();

    expect(firstCallback).not.toHaveBeenCalled();
    // eslint-disable-next-line vitest/prefer-called-with -- The records' contents are covered by the options test.
    expect(secondCallback).toHaveBeenCalled();
    expect(testEditor.doc).toEqualProseMirrorNode(doc(p("Helloxy")));
  });

  test("are visible to spies on the real prototype", () => {
    const observeSpy = vi.spyOn(MutationObserver.prototype, "observe");
    const testEditor = renderProseMirror(makeTaskDoc(), {
      editorProps: { nodeViews },
    });
    const view = captureView(testEditor);

    expect(observeSpy).toHaveBeenCalledWith(view.dom, {
      attributeFilter: ["contenteditable"],
    });

    observeSpy.mockRestore();
  });
});

describe("ProseMirror's own observer", () => {
  test("reads each typed edit once, synchronously", async () => {
    expect.assertions(4);

    let docChanges = 0;
    const testEditor = renderProseMirror(doc(p("Hello")), {
      editorProps: {
        plugins: [
          new Plugin({
            filterTransaction: (tr): boolean => {
              if (tr.docChanged) {
                docChanges += 1;
              }
              return true;
            },
          }),
        ],
      },
    });

    testEditor.setSelection("end");
    testEditor.type("ab");

    expect(testEditor.doc).toEqualProseMirrorNode(doc(p("Helloab")));
    expect(docChanges).toBe(2);

    await settle();

    expect(testEditor.doc).toEqualProseMirrorNode(doc(p("Helloab")));
    expect(docChanges).toBe(2);
  });

  test("typing throws when prosemirror-view has no DOMObserver.flush()", () => {
    const testEditor = renderProseMirror(doc(p("Hello")));
    const view = captureView(testEditor) as unknown as {
      domObserver: object;
    };
    const { domObserver } = view;
    view.domObserver = new Proxy(domObserver, {
      get: (target, key): unknown => {
        if (key === "flush") {
          return undefined;
        }
        const value: unknown = Reflect.get(target, key);
        return typeof value === "function" ? value.bind(target) : value;
      },
    });

    expect(() => {
      testEditor.type("x");
    }).toThrow(
      "Cannot simulate typing: this prosemirror-view version has no DOMObserver.flush()",
    );

    view.domObserver = domObserver;
  });
});
