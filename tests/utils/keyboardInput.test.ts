import { expect, test } from "vitest";

import { tokenizeKeyboardInput, escapeKey } from "../../src/utils/keyboardInput";

test("Keyboard input tokenization", () => {
  expect(tokenizeKeyboardInput("foo")).toStrictEqual(["f", "o", "o"]);
  expect(tokenizeKeyboardInput("{{a[[")).toStrictEqual(["{", "a", "["]);
  expect(tokenizeKeyboardInput("{Enter}{f}{o}{o}")).toStrictEqual([
    "Enter",
    "f",
    "o",
    "o",
  ]);
  expect(tokenizeKeyboardInput("{Enter}{f}o{o}")).toStrictEqual([
    "Enter",
    "f",
    "o",
    "o",
  ]);
  expect(tokenizeKeyboardInput("[Enter][f][o][o]")).toStrictEqual([
    "Enter",
    "f",
    "o",
    "o",
  ]);
  expect(tokenizeKeyboardInput("[Enter][f]o[o]")).toStrictEqual([
    "Enter",
    "f",
    "o",
    "o",
  ]);
  expect(tokenizeKeyboardInput("{\\}}")).toStrictEqual(["}"]);
  expect(tokenizeKeyboardInput("{]}")).toStrictEqual(["]"]);
  expect(tokenizeKeyboardInput("[\\]]")).toStrictEqual(["]"]);
  expect(tokenizeKeyboardInput("{\\]}")).toStrictEqual(["\\]"]);
  expect(tokenizeKeyboardInput("[\\}]")).toStrictEqual(["\\}"]);
  expect(tokenizeKeyboardInput("[}]")).toStrictEqual(["}"]);
  expect(tokenizeKeyboardInput("{KeyF}")).toStrictEqual(["f"]);
});

test("Key escaping", () => {
  expect(escapeKey("f")).toBe("f");
  expect(escapeKey("o")).toBe("o");
  expect(escapeKey("Enter")).toBe("{Enter}");
  expect(escapeKey("Shift")).toBe("{Shift}");
  expect(escapeKey("{")).toBe("{{");
  expect(escapeKey("[")).toBe("[[");
  expect(escapeKey("Some}")).toBe("[Some}]");
  expect(escapeKey("Some]")).toBe("{Some]}");
  expect(escapeKey("Some}Other]")).toBe("{Some\\}Other]}");
});
