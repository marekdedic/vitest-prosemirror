import { describe, expect, test } from "vitest";

import { graphemeBoundary } from "../../src/typing/grapheme";

describe("graphemeBoundary", () => {
  test("should step forward over a surrogate pair", () => {
    expect(graphemeBoundary("a👍b", 1, 1)).toBe(3);
  });

  test("should step backward over a surrogate pair", () => {
    expect(graphemeBoundary("a👍b", 3, -1)).toBe(1);
  });

  test("should return null at the end when moving forward", () => {
    expect(graphemeBoundary("ab", 2, 1)).toBeNull();
  });

  test("should return null at the start when moving backward", () => {
    expect(graphemeBoundary("ab", 0, -1)).toBeNull();
  });
});
