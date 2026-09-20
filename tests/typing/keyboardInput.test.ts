import { expect, test } from "vitest";

import { tokenizeKeyboardInput } from "../../src/typing/keyboardInput";

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

test("Keyboard input chord keys with special characters", () => {
  expect(tokenizeKeyboardInput("{Mod->}")).toStrictEqual(["Mod->"]);
  expect(tokenizeKeyboardInput("{Shift-Mod->}")).toStrictEqual(["Shift-Mod->"]);
  expect(tokenizeKeyboardInput("{Mod-Shift-\\\\}")).toStrictEqual([
    "Mod-Shift-\\",
  ]);
  expect(tokenizeKeyboardInput("[Mod-Shift-\\\\]")).toStrictEqual([
    "Mod-Shift-\\",
  ]);
});

test("Keyboard input unterminated group", () => {
  expect(() => tokenizeKeyboardInput("{Enter")).toThrow(
    "Unterminated group in keyboard input",
  );
  expect(() => tokenizeKeyboardInput("[Enter")).toThrow(
    "Unterminated group in keyboard input",
  );
  // A single trailing backslash escapes the closing brace, leaving the group open.
  expect(() => tokenizeKeyboardInput("{Mod-Shift-\\}")).toThrow(
    "Unterminated group in keyboard input",
  );
});

test("Keyboard input invalid values", () => {
  expect(() => tokenizeKeyboardInput(">")).not.toThrow();
  expect(() => tokenizeKeyboardInput("{>}")).not.toThrow();
  expect(() => tokenizeKeyboardInput("[>]")).not.toThrow();
  expect(() => tokenizeKeyboardInput("/")).not.toThrow();
  expect(() => tokenizeKeyboardInput("{/}")).not.toThrow();
  expect(() => tokenizeKeyboardInput("[/]")).not.toThrow();

  expect(() => tokenizeKeyboardInput("{a>}")).toThrow(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("{Shift>}")).toThrow(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("{a>5}")).toThrow(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("{Shift>5}")).toThrow(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("{a>55}")).toThrow(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("{Shift>55}")).toThrow(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("{a>5/}")).toThrow(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("{Shift>5/}")).toThrow(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("{a>55/}")).toThrow(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("{Shift>55/}")).toThrow(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("{/a}")).toThrow(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("{/Shift}")).toThrow(
    "Unsupported keyboard input",
  );

  expect(() => tokenizeKeyboardInput("[a>]")).toThrow(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("[Shift>]")).toThrow(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("[a>5]")).toThrow(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("[Shift>5]")).toThrow(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("[a>55]")).toThrow(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("[Shift>55]")).toThrow(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("[a>5/]")).toThrow(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("[Shift>5/]")).toThrow(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("[a>55/]")).toThrow(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("[Shift>55/]")).toThrow(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("[/a]")).toThrow(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("[/Shift]")).toThrow(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("[a>]")).toThrow(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("[Shift>]")).toThrow(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("[a>5]")).toThrow(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("[Shift>5]")).toThrow(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("[a>55]")).toThrow(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("[Shift>55]")).toThrow(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("[a>5/]")).toThrow(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("[Shift>5/]")).toThrow(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("[a>55/]")).toThrow(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("[Shift>55/]")).toThrow(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("[/a]")).toThrow(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("[/Shift]")).toThrow(
    "Unsupported keyboard input",
  );
});
