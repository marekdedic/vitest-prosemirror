import { describe, expect, test } from "vitest";

import { containsRTL } from "../../src/typing/direction";

describe("containsRTL", () => {
  test("should detect Hebrew", () => {
    expect(containsRTL("אבג")).toBe(true);
  });

  test("should detect Arabic", () => {
    expect(containsRTL("مرحبا")).toBe(true);
  });

  test("should not flag plain Latin text", () => {
    expect(containsRTL("Hello world")).toBe(false);
  });

  test("should not flag digits and punctuation", () => {
    expect(containsRTL("123, .-!")).toBe(false);
  });

  test("should not flag emoji", () => {
    expect(containsRTL("a👍b👨‍👩‍👧")).toBe(false);
  });
});
