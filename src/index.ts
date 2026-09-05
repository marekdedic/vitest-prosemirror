import type { Node } from "prosemirror-model";

import { afterEach, expect } from "vitest";

import { isProseMirrorNode } from "./isProseMirrorNode";
import { cleanupTesters } from "./ProseMirrorTester";
import { stringifyProseMirrorNode } from "./stringifyProseMirrorNode";

export type { Clipboard } from "./clipboard/copy";
export type { PasteContent, PasteInput } from "./clipboard/paste";
export { type Options, ProseMirrorTester } from "./ProseMirrorTester";
export type { TesterSelection } from "./selection";

export interface CustomMatchers<R = unknown> {
  toEqualProseMirrorNode(expected: Node): R;
}

/* eslint-disable @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars -- This is an override for vitest matchers; the type parameters must match vitest's Matchers signature exactly */

declare module "vitest" {
  interface Matchers<
    R extends Promise<void> | void = Promise<void> | void,
    T = unknown,
  > extends CustomMatchers<R> {}
}

/* eslint-enable */

afterEach(cleanupTesters);

expect.extend({
  toEqualProseMirrorNode(received: Node, expected: Node) {
    const receivedDoc = `\n${stringifyProseMirrorNode(received)}\n`;
    const expectedDoc = `\n${stringifyProseMirrorNode(expected)}\n`;
    const sameSchema = received.type.schema === expected.type.schema;
    const pass = sameSchema && this.equals(receivedDoc, expectedDoc);
    const message = pass
      ? (): string =>
          `${this.utils.matcherHint(".not.toEqualProsemirrorNode")}\n\n` +
          `Expected value of document to not equal:\n  ${this.utils.printExpected(expectedDoc)}\n` +
          `Actual:\n  ${this.utils.printReceived(receivedDoc)}`
      : (): string => {
          if (!sameSchema && this.equals(receivedDoc, expectedDoc)) {
            return `${this.utils.matcherHint(".toEqualProsemirrorNode")}\n\nThe documents stringify identically but come from different schemas:\n${this.utils.printReceived(receivedDoc)}`;
          }

          const diffString = this.utils.diff(expectedDoc, receivedDoc);
          return `${this.utils.matcherHint(".toEqualProsemirrorNode")}\n\nExpected value of document to equal:\n${this.utils.printExpected(expectedDoc)}\nActual:\n${this.utils.printReceived(receivedDoc)}${diffString === undefined ? "" : `\n\nDifference:\n\n${diffString}`}`;
        };
    return {
      message,
      pass,
    };
  },
});

expect.addSnapshotSerializer({
  // StringifyProseMirrorNode prefixes the top line with `indentation`, but
  // pretty-format positions the first line itself, so drop that leading prefix
  // while keeping nested lines correctly indented.
  serialize: (val: Node, _config, indentation): string =>
    stringifyProseMirrorNode(val, indentation).slice(indentation.length),
  test: isProseMirrorNode,
});
