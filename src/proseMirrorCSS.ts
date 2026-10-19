import css from "prosemirror-view/style/prosemirror.css?raw";

let styleElement: HTMLStyleElement | null = null;

export const installProseMirrorCSS = (): void => {
  if (styleElement !== null) {
    return;
  }
  styleElement = document.createElement("style");
  styleElement.textContent = css;
  document.head.prepend(styleElement);
};

export const uninstallProseMirrorCSS = (): void => {
  styleElement?.remove();
  styleElement = null;
};
