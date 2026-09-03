import type { KeyboardModifiers } from "./typing";

export interface KeyChord {
  key: string;
  modifiers: KeyboardModifiers;
}

// Mirrors prosemirror-keymap's normalizeKeyName: split on "-" except a trailing one (so "Mod--" is
// Mod plus the minus key), the last part is the key, and each preceding part is a modifier. "Mod"
// resolves to Ctrl here because jsdom's navigator.platform is "".
export function parseKeyChord(token: string): KeyChord {
  const parts = token.split(/-(?!$)/u);
  const key =
    parts[parts.length - 1] === "Space" ? " " : parts[parts.length - 1];

  const modifiers: KeyboardModifiers = {};
  for (const modifier of parts.slice(0, -1)) {
    if (/^(cmd|meta|m)$/iu.test(modifier)) {
      modifiers.metaKey = true;
    } else if (/^a(lt)?$/iu.test(modifier)) {
      modifiers.altKey = true;
    } else if (/^(c|ctrl|control)$/iu.test(modifier)) {
      modifiers.ctrlKey = true;
    } else if (/^s(hift)?$/iu.test(modifier)) {
      modifiers.shiftKey = true;
    } else if (/^mod$/iu.test(modifier)) {
      modifiers.ctrlKey = true;
    } else {
      throw new Error(`Unrecognized modifier name: ${modifier}`);
    }
  }

  return { key, modifiers };
}
