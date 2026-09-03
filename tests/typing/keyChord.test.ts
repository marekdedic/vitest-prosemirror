import { expect, test } from "vitest";

import { parseKeyChord } from "../../src/typing/keyChord";

test("Plain key without modifiers", () => {
  expect(parseKeyChord("b")).toStrictEqual({ key: "b", modifiers: {} });
  expect(parseKeyChord("Enter")).toStrictEqual({ key: "Enter", modifiers: {} });
  expect(parseKeyChord("-")).toStrictEqual({ key: "-", modifiers: {} });
});

test("Modifier aliases", () => {
  expect(parseKeyChord("Ctrl-b")).toStrictEqual({
    key: "b",
    modifiers: { ctrlKey: true },
  });
  expect(parseKeyChord("c-b")).toStrictEqual({
    key: "b",
    modifiers: { ctrlKey: true },
  });
  expect(parseKeyChord("Control-b")).toStrictEqual({
    key: "b",
    modifiers: { ctrlKey: true },
  });
  expect(parseKeyChord("Meta-b")).toStrictEqual({
    key: "b",
    modifiers: { metaKey: true },
  });
  expect(parseKeyChord("Cmd-b")).toStrictEqual({
    key: "b",
    modifiers: { metaKey: true },
  });
  expect(parseKeyChord("m-b")).toStrictEqual({
    key: "b",
    modifiers: { metaKey: true },
  });
  expect(parseKeyChord("Alt-b")).toStrictEqual({
    key: "b",
    modifiers: { altKey: true },
  });
  expect(parseKeyChord("a-b")).toStrictEqual({
    key: "b",
    modifiers: { altKey: true },
  });
  expect(parseKeyChord("Shift-b")).toStrictEqual({
    key: "b",
    modifiers: { shiftKey: true },
  });
  expect(parseKeyChord("s-b")).toStrictEqual({
    key: "b",
    modifiers: { shiftKey: true },
  });
});

test("Mod resolves to Ctrl in jsdom", () => {
  expect(parseKeyChord("Mod-b")).toStrictEqual({
    key: "b",
    modifiers: { ctrlKey: true },
  });
});

test("Multiple modifiers in any order", () => {
  expect(parseKeyChord("Shift-Ctrl-Enter")).toStrictEqual({
    key: "Enter",
    modifiers: { ctrlKey: true, shiftKey: true },
  });
});

test("Space alias", () => {
  expect(parseKeyChord("Mod-Space")).toStrictEqual({
    key: " ",
    modifiers: { ctrlKey: true },
  });
});

test("A trailing dash is the minus key, not a separator", () => {
  expect(parseKeyChord("Mod--")).toStrictEqual({
    key: "-",
    modifiers: { ctrlKey: true },
  });
});

test("Unrecognised modifier throws", () => {
  expect(() => parseKeyChord("Foo-b")).toThrow(
    "Unrecognized modifier name: Foo",
  );
});
