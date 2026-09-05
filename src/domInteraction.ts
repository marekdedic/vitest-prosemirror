import type { EditorView } from "prosemirror-view";

const clickHandlerProps = [
  "handleClick",
  "handleClickOn",
  "handleDoubleClick",
  "handleDoubleClickOn",
  "handleTripleClick",
  "handleTripleClickOn",
] as const;

export const element = (view: EditorView, selector: string): HTMLElement => {
  const found = view.dom.querySelector<HTMLElement>(selector);
  if (found === null) {
    throw new Error(
      `No element matching "${selector}" was found in the editor DOM.`,
    );
  }
  return found;
};

export const elements = (
  view: EditorView,
  selector: string,
): Array<HTMLElement> => [...view.dom.querySelectorAll<HTMLElement>(selector)];

export const click = (view: EditorView, target: Element | string): boolean => {
  if (
    clickHandlerProps.some((prop) => view.someProp(prop, () => true) === true)
  ) {
    throw new Error(
      "click() cannot reach handleClick / handleClickOn / handleDoubleClick* / handleTripleClick* handlers: jsdom has no layout, so posAtCoords is always null and ProseMirror's mousedown handler bails before calling them. Click a node view's own DOM element instead.",
    );
  }

  const target_ = typeof target === "string" ? element(view, target) : target;
  const event = new MouseEvent("click", { bubbles: true, cancelable: true });
  target_.dispatchEvent(event);
  return event.defaultPrevented;
};
