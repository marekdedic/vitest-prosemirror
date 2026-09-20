import type { Mark } from "prosemirror-model";

import stringifyObject from "stringify-object";

// Shared across every `stringify-object` call so attrs (on nodes, on marks
// wrapping content, and on standalone stored marks) all format identically.
export const stringifyObjectOptions = {
  indent: "  ",
  inlineCharacterLimit: 1000,
};

export const stringifyMark = (mark: Mark): string =>
  Object.keys(mark.attrs).length > 0
    ? `${mark.type.name}(${stringifyObject(mark.attrs, stringifyObjectOptions)})`
    : mark.type.name;
