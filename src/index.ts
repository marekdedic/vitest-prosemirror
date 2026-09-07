import type { Node } from "prosemirror-model";
import type { EditorState } from "prosemirror-state";

import { afterEach, expect } from "vitest";

import { isEditorState } from "./isEditorState";
import { isProseMirrorNode } from "./isProseMirrorNode";
import { cleanupTesters, ProseMirrorTester } from "./ProseMirrorTester";
import { resolveSelection, type TesterSelection } from "./selection";
import { stringifyEditorState } from "./stringifyEditorState";
import { stringifyProseMirrorNode } from "./stringifyProseMirrorNode";

export type { Clipboard } from "./clipboard/copy";
export type { PasteContent, PasteInput } from "./clipboard/paste";
export { type Options, ProseMirrorTester } from "./ProseMirrorTester";
export type { TesterSelection } from "./selection";

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

afterEach(cleanupTesters);

expect.extend({
  toEqualProseMirrorNode(received: Node, expected: Node) {
    const receivedDoc = `\n${stringifyProseMirrorNode(received)}\n`;
    const expectedDoc = `\n${stringifyProseMirrorNode(expected)}\n`;
    const sameSchema = received.type.schema === expected.type.schema;
    const pass = sameSchema && this.equals(receivedDoc, expectedDoc);
    const message = pass
      ? (): string =>
          `${this.utils.matcherHint(".not.toEqualProseMirrorNode")}\n\n` +
          `Expected value of document to not equal:\n  ${this.utils.printExpected(expectedDoc)}\n` +
          `Actual:\n  ${this.utils.printReceived(receivedDoc)}`
      : (): string => {
          if (!sameSchema && this.equals(receivedDoc, expectedDoc)) {
            return `${this.utils.matcherHint(".toEqualProseMirrorNode")}\n\nThe documents stringify identically but come from different schemas:\n${this.utils.printReceived(receivedDoc)}`;
          }

          const diffString = this.utils.diff(expectedDoc, receivedDoc);
          return `${this.utils.matcherHint(".toEqualProseMirrorNode")}\n\nExpected value of document to equal:\n${this.utils.printExpected(expectedDoc)}\nActual:\n${this.utils.printReceived(receivedDoc)}${diffString === undefined ? "" : `\n\nDifference:\n\n${diffString}`}`;
        };
    return {
      message,
      pass,
    };
  },
  toHaveSelection(
    received: EditorState | ProseMirrorTester,
    expected: TesterSelection,
  ) {
    const state =
      received instanceof ProseMirrorTester ? received.state : received;
    const receivedSelection = state.selection;
    const expectedSelection = resolveSelection(state.doc, expected);

    const receivedDoc = `\n${stringifyProseMirrorNode(state.doc, receivedSelection)}\n`;
    const expectedDoc = `\n${stringifyProseMirrorNode(state.doc, expectedSelection)}\n`;
    const pass = receivedSelection.eq(expectedSelection);
    const message = pass
      ? (): string =>
          `${this.utils.matcherHint(".not.toHaveSelection")}\n\n` +
          `Expected selection to not equal:\n${this.utils.printExpected(expectedDoc)}\n` +
          `Actual:\n${this.utils.printReceived(receivedDoc)}`
      : (): string => {
          const diffString = this.utils.diff(expectedDoc, receivedDoc);
          // Always name the selection kind: when only the kind differs (e.g. an
          // `AllSelection` vs a `TextSelection` over the same span) the marker
          // renderings can be identical, so the diff alone would look empty.
          return (
            `${this.utils.matcherHint(".toHaveSelection")}\n\n` +
            `Expected selection to equal (${this.utils.printExpected(expectedSelection.constructor.name)}):\n${this.utils.printExpected(expectedDoc)}\n` +
            `Actual (${this.utils.printReceived(receivedSelection.constructor.name)}):\n${this.utils.printReceived(receivedDoc)}${diffString === undefined ? "" : `\n\nDifference:\n\n${diffString}`}`
          );
        };
    return {
      message,
      pass,
    };
  },
});

expect.addSnapshotSerializer({
  // The serialiser prefixes the top line with `indentation`, but pretty-format
  // positions the first line itself, so drop that leading prefix while keeping
  // nested lines correctly indented.
  serialize: (val: Node, _config, indentation): string =>
    stringifyProseMirrorNode(val, undefined, indentation).slice(
      indentation.length,
    ),
  test: isProseMirrorNode,
});

expect.addSnapshotSerializer({
  // Same leading-prefix trim as the node serializer above
  serialize: (
    val: EditorState | ProseMirrorTester,
    _config,
    indentation,
  ): string => {
    const state = val instanceof ProseMirrorTester ? val.state : val;
    return stringifyEditorState(state, indentation).slice(indentation.length);
  },
  test: (val: unknown): boolean =>
    val instanceof ProseMirrorTester || isEditorState(val),
});
