import type { Node as ProseMirrorNode } from "prosemirror-model";

import { schema as basicSchema } from "prosemirror-schema-basic";
import { describe, expect, test } from "vitest";

import { ProseMirrorTester } from "../src/index";
import { MutationObserverMock } from "../src/MutationObserverMock";
import { cleanupTesters } from "../src/ProseMirrorTester";

// Captured before any tester in this file replaces the global.
const originalMutationObserver = global.MutationObserver;

const makeDoc = (): ProseMirrorNode =>
  basicSchema.nodes.doc.create(
    {},
    basicSchema.nodes.paragraph.createAndFill({}, basicSchema.text("Hello")),
  );

const destroyedMessage =
  "This ProseMirrorTester has been destroyed. Testers are destroyed automatically after each test; pass { autoCleanup: false } to keep one alive (e.g. across a beforeAll).";

describe("destroy", () => {
  test("should remove the editor element from the document", () => {
    const before = document.body.children.length;
    const testEditor = new ProseMirrorTester(makeDoc());

    expect(document.body.children).toHaveLength(before + 1);

    testEditor.destroy();

    expect(document.body.children).toHaveLength(before);
  });

  test("should be idempotent", () => {
    const testEditor = new ProseMirrorTester(makeDoc());
    testEditor.destroy();

    expect(() => {
      testEditor.destroy();
    }).not.toThrow();
  });

  test("should make getters throw after destruction", () => {
    const testEditor = new ProseMirrorTester(makeDoc());
    testEditor.destroy();

    expect(() => testEditor.doc).toThrow(destroyedMessage);
    expect(() => testEditor.state).toThrow(destroyedMessage);
    expect(() => testEditor.html).toThrow(destroyedMessage);
    expect(() => testEditor.text).toThrow(destroyedMessage);
  });

  test("should make methods throw after destruction", () => {
    const testEditor = new ProseMirrorTester(makeDoc());
    testEditor.destroy();

    expect(() => {
      testEditor.insertText("x");
    }).toThrow(destroyedMessage);
    expect(() => {
      testEditor.selectText("end");
    }).toThrow(destroyedMessage);
  });

  test("should restore global.MutationObserver only once the last tester is destroyed", () => {
    const first = new ProseMirrorTester(makeDoc());
    const second = new ProseMirrorTester(makeDoc());

    expect(global.MutationObserver).toBe(MutationObserverMock);

    first.destroy();

    expect(global.MutationObserver).toBe(MutationObserverMock);

    second.destroy();

    expect(global.MutationObserver).toBe(originalMutationObserver);
  });
});

describe("cleanupTesters", () => {
  test("should destroy testers with auto-cleanup enabled", () => {
    const testEditor = new ProseMirrorTester(makeDoc());

    cleanupTesters();

    expect(() => testEditor.doc).toThrow(destroyedMessage);
  });

  test("should leave testers created with autoCleanup: false alive", () => {
    const testEditor = new ProseMirrorTester(makeDoc(), { autoCleanup: false });

    cleanupTesters();

    expect(() => testEditor.doc).not.toThrow();

    testEditor.destroy();
  });
});

describe("auto-cleanup hook", () => {
  test("should leave a tester behind for the afterEach hook", () => {
    // No reference kept and no manual destroy; the afterEach registered in
    // src/index.ts must clean it up before the next test runs.
    new ProseMirrorTester(makeDoc());

    expect(document.body.children.length).toBeGreaterThan(0);
  });

  test("should find the previous test's editor already removed", () => {
    expect(document.body.children).toHaveLength(0);
  });
});
