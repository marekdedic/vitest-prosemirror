import type { Node } from "prosemirror-model";

import type { TesterSelection } from "./index.js";

import "vitest";

export interface CustomMatchers<R = unknown> {
  toEqualProseMirrorNode(expected: Node): R;
  toHaveSelection(expected: TesterSelection): R;
}

/* eslint-disable @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars -- This is an override for vitest matchers; the type parameters must match vitest's Matchers signature exactly */

declare module "vitest" {
  interface Matchers<
    R extends Promise<void> | void = Promise<void> | void,
    T = unknown,
  > extends CustomMatchers<R> {}
}

/* eslint-enable */
