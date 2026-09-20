export function tokenizeKeyboardInput(input: string): Array<string> {
  const output = [];

  let currentGroupOpener: "[" | "{" | null = null;
  let group = "";
  let escaped = false;
  for (const char of input) {
    if (currentGroupOpener !== null) {
      if (escaped) {
        // A backslash escapes the group's own closing brace and another backslash, so a
        // literal "}", "]" or "\" key can be written; any other "\X" stays literal.
        group +=
          char === matchingBrace(currentGroupOpener) || char === "\\"
            ? char
            : `\\${char}`;
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === matchingBrace(currentGroupOpener)) {
        assertSupported(group);
        if (group.length === 4 && group.startsWith("Key")) {
          output.push(group.slice(3).toLowerCase());
        } else {
          output.push(group);
        }
        currentGroupOpener = null;
        group = "";
      } else if (group === "" && currentGroupOpener === char) {
        output.push(char);
        currentGroupOpener = null;
      } else {
        group += char;
      }
    } else if (["[", "{"].includes(char)) {
      currentGroupOpener = char as "[" | "{";
    } else {
      output.push(char);
    }
  }

  if (currentGroupOpener !== null) {
    throw new Error("Unterminated group in keyboard input");
  }

  return output;
}

// The press-and-hold / repeat / release forms of testing-library ("{key>}", "{key>5}",
// "{key>5/}", "{/key}") are unsupported and throw on usage.
function assertSupported(group: string): never | void {
  if (/^\/.+/u.exec(group) || /.*[^-]>[\d]*\/?$/u.exec(group)) {
    throw new Error("Unsupported keyboard input");
  }
}

function matchingBrace(opener: "[" | "{"): "]" | "}" {
  return opener === "{" ? "}" : "]";
}
