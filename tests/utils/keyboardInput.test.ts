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

test("Keyboard input invalid values", () => {
  expect(() => tokenizeKeyboardInput(">")).not.toThrowError();
  expect(() => tokenizeKeyboardInput("{>}")).not.toThrowError();
  expect(() => tokenizeKeyboardInput("[>]")).not.toThrowError();
  expect(() => tokenizeKeyboardInput("/")).not.toThrowError();
  expect(() => tokenizeKeyboardInput("{/}")).not.toThrowError();
  expect(() => tokenizeKeyboardInput("[/]")).not.toThrowError();

  expect(() => tokenizeKeyboardInput("{a>}")).toThrowError(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("{Shift>}")).toThrowError(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("{a>5}")).toThrowError(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("{Shift>5}")).toThrowError(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("{a>55}")).toThrowError(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("{Shift>55}")).toThrowError(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("{a>5/}")).toThrowError(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("{Shift>5/}")).toThrowError(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("{a>55/}")).toThrowError(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("{Shift>55/}")).toThrowError(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("{/a}")).toThrowError(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("{/Shift}")).toThrowError(
    "Unsupported keyboard input",
  );

  expect(() => tokenizeKeyboardInput("[a>]")).toThrowError(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("[Shift>]")).toThrowError(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("[a>5]")).toThrowError(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("[Shift>5]")).toThrowError(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("[a>55]")).toThrowError(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("[Shift>55]")).toThrowError(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("[a>5/]")).toThrowError(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("[Shift>5/]")).toThrowError(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("[a>55/]")).toThrowError(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("[Shift>55/]")).toThrowError(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("[/a]")).toThrowError(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("[/Shift]")).toThrowError(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("[a>]")).toThrowError(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("[Shift>]")).toThrowError(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("[a>5]")).toThrowError(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("[Shift>5]")).toThrowError(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("[a>55]")).toThrowError(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("[Shift>55]")).toThrowError(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("[a>5/]")).toThrowError(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("[Shift>5/]")).toThrowError(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("[a>55/]")).toThrowError(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("[Shift>55/]")).toThrowError(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("[/a]")).toThrowError(
    "Unsupported keyboard input",
  );
  expect(() => tokenizeKeyboardInput("[/Shift]")).toThrowError(
    "Unsupported keyboard input",
  );
});
