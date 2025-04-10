import { expect, test } from "vitest";

import { tokenizeKeyboardInput } from "../../src/utils/keyboardInput";

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
