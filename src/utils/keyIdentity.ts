export interface KeyIdentity {
  charCode: number;
  code: string;
  key: string;
  keyCode: number;
  location: number;
}

// Legacy keyCode values are not defined by the UI Events spec - these follow the tables in
// https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode, i.e. Chromium behaviour.
const namedKeys = new Map<string, number>(
  Object.entries({
    Alt: 18,
    ArrowDown: 40,
    ArrowLeft: 37,
    ArrowRight: 39,
    ArrowUp: 38,
    Backspace: 8,
    CapsLock: 20,
    Control: 17,
    Delete: 46,
    End: 35,
    Enter: 13,
    Escape: 27,
    F1: 112,
    F2: 113,
    F3: 114,
    F4: 115,
    F5: 116,
    F6: 117,
    F7: 118,
    F8: 119,
    F9: 120,
    F10: 121,
    F11: 122,
    F12: 123,
    Home: 36,
    Insert: 45,
    Meta: 91,
    PageDown: 34,
    PageUp: 33,
    Shift: 16,
    Tab: 9,
  }),
);

const sidedCodes = new Map<string, string>(
  Object.entries({
    Alt: "AltLeft",
    Control: "ControlLeft",
    Meta: "MetaLeft",
    Shift: "ShiftLeft",
  }),
);

const standardLocation = 0;
const leftLocation = 1;

// Enter is the only named key that fires a keypress, reported as a carriage return.
// Tab fires none, even though the tester types a tab character for it.
const namedCharCodes = new Map<string, number>(
  Object.entries({
    Enter: 13,
  }),
);

const noCharacter = 0;

// The keyCode identifies the physical key, so shifted characters share the unshifted key's identity.
const characterKeys = new Map<string, KeyIdentity>(
  Object.entries({
    " ": {
      charCode: 32,
      code: "Space",
      key: " ",
      keyCode: 32,
      location: standardLocation,
    },
    "!": {
      charCode: 33,
      code: "Digit1",
      key: "!",
      keyCode: 49,
      location: standardLocation,
    },
    '"': {
      charCode: 34,
      code: "Quote",
      key: '"',
      keyCode: 222,
      location: standardLocation,
    },
    "#": {
      charCode: 35,
      code: "Digit3",
      key: "#",
      keyCode: 51,
      location: standardLocation,
    },
    $: {
      charCode: 36,
      code: "Digit4",
      key: "$",
      keyCode: 52,
      location: standardLocation,
    },
    "%": {
      charCode: 37,
      code: "Digit5",
      key: "%",
      keyCode: 53,
      location: standardLocation,
    },
    "&": {
      charCode: 38,
      code: "Digit7",
      key: "&",
      keyCode: 55,
      location: standardLocation,
    },
    "'": {
      charCode: 39,
      code: "Quote",
      key: "'",
      keyCode: 222,
      location: standardLocation,
    },
    "(": {
      charCode: 40,
      code: "Digit9",
      key: "(",
      keyCode: 57,
      location: standardLocation,
    },
    ")": {
      charCode: 41,
      code: "Digit0",
      key: ")",
      keyCode: 48,
      location: standardLocation,
    },
    "*": {
      charCode: 42,
      code: "Digit8",
      key: "*",
      keyCode: 56,
      location: standardLocation,
    },
    "+": {
      charCode: 43,
      code: "Equal",
      key: "+",
      keyCode: 187,
      location: standardLocation,
    },
    ",": {
      charCode: 44,
      code: "Comma",
      key: ",",
      keyCode: 188,
      location: standardLocation,
    },
    "-": {
      charCode: 45,
      code: "Minus",
      key: "-",
      keyCode: 189,
      location: standardLocation,
    },
    ".": {
      charCode: 46,
      code: "Period",
      key: ".",
      keyCode: 190,
      location: standardLocation,
    },
    "/": {
      charCode: 47,
      code: "Slash",
      key: "/",
      keyCode: 191,
      location: standardLocation,
    },
    ":": {
      charCode: 58,
      code: "Semicolon",
      key: ":",
      keyCode: 186,
      location: standardLocation,
    },
    ";": {
      charCode: 59,
      code: "Semicolon",
      key: ";",
      keyCode: 186,
      location: standardLocation,
    },
    "<": {
      charCode: 60,
      code: "Comma",
      key: "<",
      keyCode: 188,
      location: standardLocation,
    },
    "=": {
      charCode: 61,
      code: "Equal",
      key: "=",
      keyCode: 187,
      location: standardLocation,
    },
    ">": {
      charCode: 62,
      code: "Period",
      key: ">",
      keyCode: 190,
      location: standardLocation,
    },
    "?": {
      charCode: 63,
      code: "Slash",
      key: "?",
      keyCode: 191,
      location: standardLocation,
    },
    "@": {
      charCode: 64,
      code: "Digit2",
      key: "@",
      keyCode: 50,
      location: standardLocation,
    },
    "[": {
      charCode: 91,
      code: "BracketLeft",
      key: "[",
      keyCode: 219,
      location: standardLocation,
    },
    "\\": {
      charCode: 92,
      code: "Backslash",
      key: "\\",
      keyCode: 220,
      location: standardLocation,
    },
    "]": {
      charCode: 93,
      code: "BracketRight",
      key: "]",
      keyCode: 221,
      location: standardLocation,
    },
    "^": {
      charCode: 94,
      code: "Digit6",
      key: "^",
      keyCode: 54,
      location: standardLocation,
    },
    _: {
      charCode: 95,
      code: "Minus",
      key: "_",
      keyCode: 189,
      location: standardLocation,
    },
    "`": {
      charCode: 96,
      code: "Backquote",
      key: "`",
      keyCode: 192,
      location: standardLocation,
    },
    "{": {
      charCode: 123,
      code: "BracketLeft",
      key: "{",
      keyCode: 219,
      location: standardLocation,
    },
    "|": {
      charCode: 124,
      code: "Backslash",
      key: "|",
      keyCode: 220,
      location: standardLocation,
    },
    "}": {
      charCode: 125,
      code: "BracketRight",
      key: "}",
      keyCode: 221,
      location: standardLocation,
    },
    "~": {
      charCode: 126,
      code: "Backquote",
      key: "~",
      keyCode: 192,
      location: standardLocation,
    },
  }),
);

export function keyIdentity(key: string): KeyIdentity {
  const namedKeyCode = namedKeys.get(key);
  if (namedKeyCode !== undefined) {
    const sidedCode = sidedCodes.get(key);
    return {
      charCode: namedCharCodes.get(key) ?? noCharacter,
      code: sidedCode ?? key,
      key,
      keyCode: namedKeyCode,
      location: sidedCode === undefined ? standardLocation : leftLocation,
    };
  }

  if (/^[a-z]$/iu.exec(key)) {
    const upperCaseKey = key.toUpperCase();
    return {
      charCode: key.charCodeAt(0),
      code: `Key${upperCaseKey}`,
      key,
      keyCode: upperCaseKey.charCodeAt(0),
      location: standardLocation,
    };
  }

  if (/^\d$/u.exec(key)) {
    return {
      charCode: key.charCodeAt(0),
      code: `Digit${key}`,
      key,
      keyCode: key.charCodeAt(0),
      location: standardLocation,
    };
  }

  const characterKey = characterKeys.get(key);
  if (characterKey !== undefined) {
    return characterKey;
  }

  // Characters outside the tables have an unknown physical key, but still produce themselves.
  return {
    charCode: key.length === 1 ? key.charCodeAt(0) : noCharacter,
    code: "",
    key,
    keyCode: 0,
    location: standardLocation,
  };
}
