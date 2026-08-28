import { expect, test } from "vitest";
import { base, shift } from "w3c-keyname";

import { keyIdentity } from "../../src/utils/keyIdentity";

test("Key identity of named keys", () => {
  expect(keyIdentity("Backspace")).toStrictEqual({
    charCode: 0,
    code: "Backspace",
    key: "Backspace",
    keyCode: 8,
    location: 0,
  });
  expect(keyIdentity("Enter")).toStrictEqual({
    charCode: 13,
    code: "Enter",
    key: "Enter",
    keyCode: 13,
    location: 0,
  });
  expect(keyIdentity("Tab")).toStrictEqual({
    charCode: 0,
    code: "Tab",
    key: "Tab",
    keyCode: 9,
    location: 0,
  });
  expect(keyIdentity("Escape")).toStrictEqual({
    charCode: 0,
    code: "Escape",
    key: "Escape",
    keyCode: 27,
    location: 0,
  });
  expect(keyIdentity("Delete")).toStrictEqual({
    charCode: 0,
    code: "Delete",
    key: "Delete",
    keyCode: 46,
    location: 0,
  });
  expect(keyIdentity("ArrowLeft")).toStrictEqual({
    charCode: 0,
    code: "ArrowLeft",
    key: "ArrowLeft",
    keyCode: 37,
    location: 0,
  });
  expect(keyIdentity("ArrowUp")).toStrictEqual({
    charCode: 0,
    code: "ArrowUp",
    key: "ArrowUp",
    keyCode: 38,
    location: 0,
  });
  expect(keyIdentity("ArrowRight")).toStrictEqual({
    charCode: 0,
    code: "ArrowRight",
    key: "ArrowRight",
    keyCode: 39,
    location: 0,
  });
  expect(keyIdentity("ArrowDown")).toStrictEqual({
    charCode: 0,
    code: "ArrowDown",
    key: "ArrowDown",
    keyCode: 40,
    location: 0,
  });
  expect(keyIdentity("Home")).toStrictEqual({
    charCode: 0,
    code: "Home",
    key: "Home",
    keyCode: 36,
    location: 0,
  });
  expect(keyIdentity("F1")).toStrictEqual({
    charCode: 0,
    code: "F1",
    key: "F1",
    keyCode: 112,
    location: 0,
  });
  expect(keyIdentity("F12")).toStrictEqual({
    charCode: 0,
    code: "F12",
    key: "F12",
    keyCode: 123,
    location: 0,
  });
});

test("Key identity of modifier keys reports the left-hand key", () => {
  expect(keyIdentity("Shift")).toStrictEqual({
    charCode: 0,
    code: "ShiftLeft",
    key: "Shift",
    keyCode: 16,
    location: 1,
  });
  expect(keyIdentity("Control")).toStrictEqual({
    charCode: 0,
    code: "ControlLeft",
    key: "Control",
    keyCode: 17,
    location: 1,
  });
  expect(keyIdentity("Alt")).toStrictEqual({
    charCode: 0,
    code: "AltLeft",
    key: "Alt",
    keyCode: 18,
    location: 1,
  });
  expect(keyIdentity("Meta")).toStrictEqual({
    charCode: 0,
    code: "MetaLeft",
    key: "Meta",
    keyCode: 91,
    location: 1,
  });
});

test("Key identity of letters is case-independent", () => {
  expect(keyIdentity("a")).toStrictEqual({
    charCode: 97,
    code: "KeyA",
    key: "a",
    keyCode: 65,
    location: 0,
  });
  expect(keyIdentity("A")).toStrictEqual({
    charCode: 65,
    code: "KeyA",
    key: "A",
    keyCode: 65,
    location: 0,
  });
  expect(keyIdentity("z")).toStrictEqual({
    charCode: 122,
    code: "KeyZ",
    key: "z",
    keyCode: 90,
    location: 0,
  });
});

test("Key identity of digits and space", () => {
  expect(keyIdentity("0")).toStrictEqual({
    charCode: 48,
    code: "Digit0",
    key: "0",
    keyCode: 48,
    location: 0,
  });
  expect(keyIdentity("7")).toStrictEqual({
    charCode: 55,
    code: "Digit7",
    key: "7",
    keyCode: 55,
    location: 0,
  });
  expect(keyIdentity(" ")).toStrictEqual({
    charCode: 32,
    code: "Space",
    key: " ",
    keyCode: 32,
    location: 0,
  });
});

test("Key identity of shifted characters matches the unshifted physical key", () => {
  expect(keyIdentity(";")).toStrictEqual({
    charCode: 59,
    code: "Semicolon",
    key: ";",
    keyCode: 186,
    location: 0,
  });
  expect(keyIdentity(":")).toStrictEqual({
    charCode: 58,
    code: "Semicolon",
    key: ":",
    keyCode: 186,
    location: 0,
  });
  expect(keyIdentity("-")).toStrictEqual({
    charCode: 45,
    code: "Minus",
    key: "-",
    keyCode: 189,
    location: 0,
  });
  expect(keyIdentity("_")).toStrictEqual({
    charCode: 95,
    code: "Minus",
    key: "_",
    keyCode: 189,
    location: 0,
  });
  expect(keyIdentity("!")).toStrictEqual({
    charCode: 33,
    code: "Digit1",
    key: "!",
    keyCode: 49,
    location: 0,
  });
  expect(keyIdentity(")")).toStrictEqual({
    charCode: 41,
    code: "Digit0",
    key: ")",
    keyCode: 48,
    location: 0,
  });
  expect(keyIdentity("\\")).toStrictEqual({
    charCode: 92,
    code: "Backslash",
    key: "\\",
    keyCode: 220,
    location: 0,
  });
  expect(keyIdentity("}")).toStrictEqual({
    charCode: 125,
    code: "BracketRight",
    key: "}",
    keyCode: 221,
    location: 0,
  });
});

test("Key identity of unknown keys", () => {
  expect(keyIdentity("Nonsense")).toStrictEqual({
    charCode: 0,
    code: "",
    key: "Nonsense",
    keyCode: 0,
    location: 0,
  });
  expect(keyIdentity("ě")).toStrictEqual({
    charCode: 283,
    code: "",
    key: "ě",
    keyCode: 0,
    location: 0,
  });
});

// Cross-check against the key tables of w3c-keyname, the library prosemirror-keymap uses to derive
// Key names from real browser events. It only maps keyCode to key, so the check is a round trip.
test("Key identity of keys named like object properties", () => {
  expect(keyIdentity("toString")).toStrictEqual({
    charCode: 0,
    code: "",
    key: "toString",
    keyCode: 0,
    location: 0,
  });
  expect(keyIdentity("__proto__")).toStrictEqual({
    charCode: 0,
    code: "",
    key: "__proto__",
    keyCode: 0,
    location: 0,
  });
});

test("Key identity keyCodes match w3c-keyname", () => {
  const unshiftedKeys = [
    " ",
    "'",
    ",",
    "-",
    ".",
    "/",
    "0",
    "9",
    ";",
    "=",
    "[",
    "\\",
    "]",
    "`",
    "a",
    "Alt",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "Backspace",
    "CapsLock",
    "Control",
    "Delete",
    "End",
    "Enter",
    "Escape",
    "F1",
    "F12",
    "Home",
    "Insert",
    "Meta",
    "PageDown",
    "PageUp",
    "Shift",
    "Tab",
    "z",
  ];
  const shiftedKeys = [
    "!",
    '"',
    "#",
    "$",
    "%",
    "&",
    "(",
    ")",
    "*",
    "+",
    "<",
    ">",
    "?",
    "@",
    "^",
    "_",
    "{",
    "|",
    "}",
    "~",
    ":",
    "A",
    "Z",
  ];

  expect(
    unshiftedKeys.map((key) => base[keyIdentity(key).keyCode]),
  ).toStrictEqual(unshiftedKeys);
  expect(
    shiftedKeys.map((key) => shift[keyIdentity(key).keyCode]),
  ).toStrictEqual(shiftedKeys);
});
