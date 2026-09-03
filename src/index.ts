import type { Node } from "prosemirror-model";

import { afterEach, expect } from "vitest";

import { cleanupTesters } from "./ProseMirrorTester";
import { stringifyProseMirrorNode } from "./stringifyProseMirrorNode";

export { type Options, ProseMirrorTester } from "./ProseMirrorTester";
export type { TesterSelection } from "./selection";

export interface CustomMatchers<R = unknown> {
  toEqualProseMirrorNode(expected: Node): R;
}

/* eslint-disable @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any -- These are overrides for vitest matchers */

declare module "vitest" {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

/* eslint-enable */

afterEach(cleanupTesters);

expect.extend({
  toEqualProseMirrorNode(received: Node, expected: Node) {
    const receivedDoc = `\n${stringifyProseMirrorNode(received)}\n`;
    const expectedDoc = `\n${stringifyProseMirrorNode(expected)}\n`;
    const pass = this.equals(receivedDoc, expectedDoc);
    const message = pass
      ? (): string =>
          `${this.utils.matcherHint(".not.toEqualProsemirrorNode")}\n\n` +
          `Expected value of document to not equal:\n  ${this.utils.printExpected(expectedDoc)}\n` +
          `Actual:\n  ${this.utils.printReceived(receivedDoc)}`
      : (): string => {
          const diffString = this.utils.diff(expectedDoc, receivedDoc);
          return `${this.utils.matcherHint(".toEqualProsemirrorNode")}\n\nExpected value of document to equal:\n${this.utils.printExpected(expectedDoc)}\nActual:\n${this.utils.printReceived(receivedDoc)}${diffString === undefined ? "" : `\n\nDifference:\n\n${diffString}`}`;
        };
    return {
      message,
      pass,
    };
  },
});
