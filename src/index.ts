import type { Node } from "prosemirror-model";

import { expect } from "vitest";

import { stringifyProseMirrorNode } from "./stringifyProseMirrorNode";

export { ProseMirrorTester } from "./ProseMirrorTester";

export interface CustomMatchers<R = unknown> {
  toEqualProseMirrorNode(expected: Node): R;
}

/* eslint-disable @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any -- These are overridest for vitest matchers */

declare module "vitest" {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

/* eslint-enable */

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
          const diffString = this.utils.diff(expectedDoc, receivedDoc, {
            expand: this.expand ?? false,
          });
          return `${this.utils.matcherHint(".toEqualProsemirrorNode")}\n\nExpected value of document to equal:\n${this.utils.printExpected(expectedDoc)}\nActual:\n${this.utils.printReceived(receivedDoc)}${diffString !== undefined ? `\n\nDifference:\n\n${diffString}` : ""}`;
        };
    return {
      message,
      pass,
    };
  },
});
