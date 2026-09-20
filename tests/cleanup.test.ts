import type { Node as ProseMirrorNode } from "prosemirror-model";

import { describe, expect, test } from "vitest";

import { renderProseMirror } from "../src/index";
import { MutationObserverMock } from "../src/MutationObserverMock";
import { cleanupEditors } from "../src/renderProseMirror";
import { doc, p } from "./builders";

// Captured before any tester in this file replaces the global.
const originalMutationObserver = global.MutationObserver;

const makeDoc = (): ProseMirrorNode => doc(p("Hello"));

const destroyedMessage =
  "This ProseMirror editor has been destroyed. Editors are destroyed automatically after each test; pass { autoCleanup: false } to keep one alive (e.g. across a beforeAll).";

describe("destroy", () => {
  test("should remove the editor element from the document", () => {
    const before = document.body.children.length;
    const testEditor = renderProseMirror(makeDoc());

    expect(document.body.children).toHaveLength(before + 1);

    testEditor.destroy();

    expect(document.body.children).toHaveLength(before);
  });

  test("should be idempotent", () => {
    const testEditor = renderProseMirror(makeDoc());
    testEditor.destroy();

    expect(() => {
      testEditor.destroy();
    }).not.toThrow();
  });

  test("should make getters throw after destruction", () => {
    const testEditor = renderProseMirror(makeDoc());
    testEditor.destroy();

    expect(() => testEditor.doc).toThrow(destroyedMessage);
    expect(() => testEditor.state).toThrow(destroyedMessage);
    expect(() => testEditor.html).toThrow(destroyedMessage);
    expect(() => testEditor.text).toThrow(destroyedMessage);
  });

  test("should make methods throw after destruction", () => {
    const testEditor = renderProseMirror(makeDoc());
    testEditor.destroy();

    expect(() => {
      testEditor.type("x");
    }).toThrow(destroyedMessage);
    expect(() => {
      testEditor.setSelection("end");
    }).toThrow(destroyedMessage);
  });

  test("should restore global.MutationObserver only once the last tester is destroyed", () => {
    const first = renderProseMirror(makeDoc());
    const second = renderProseMirror(makeDoc());

    expect(global.MutationObserver).toBe(MutationObserverMock);

    first.destroy();

    expect(global.MutationObserver).toBe(MutationObserverMock);

    second.destroy();

    expect(global.MutationObserver).toBe(originalMutationObserver);
  });
});

describe("cleanupEditors", () => {
  test("should destroy testers with auto-cleanup enabled", () => {
    const testEditor = renderProseMirror(makeDoc());

    cleanupEditors();

    expect(() => testEditor.doc).toThrow(destroyedMessage);
  });

  test("should leave testers created with autoCleanup: false alive", () => {
    const testEditor = renderProseMirror(makeDoc(), { autoCleanup: false });

    cleanupEditors();

    expect(() => testEditor.doc).not.toThrow();

    testEditor.destroy();
  });
});

describe("auto-cleanup hook", () => {
  test("should leave a tester behind for the afterEach hook", () => {
    // No reference kept and no manual destroy; the afterEach registered in
    // src/index.ts must clean it up before the next test runs.
    renderProseMirror(makeDoc());

    expect(document.body.children.length).toBeGreaterThan(0);
  });

  test("should find the previous test's editor already removed", () => {
    expect(document.body.children).toHaveLength(0);
  });
});
