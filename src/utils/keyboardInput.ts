export function tokenizeKeyboardInput(input: string): Array<string> {
  const output = [];

  let currentGroupOpener: "[" | "{" | null = null;
  let group = "";
  for (const char of input) {
    if (currentGroupOpener !== null) {
      if (["]", "}"].includes(char)) {
        if (
          group.endsWith("\\") &&
          char === matchingBrace(currentGroupOpener)
        ) {
          group = group.slice(0, -2) + char;
        } else if (char === matchingBrace(currentGroupOpener)) {
          if (group.length === 4 && group.startsWith("Key")) {
            output.push(group.slice(3).toLowerCase());
          } else {
            output.push(group);
          }
          currentGroupOpener = null;
          group = "";
        } else {
          group += char;
        }
      } else if (group === "" && currentGroupOpener === char) {
        output.push(char);
        currentGroupOpener = null;
        group = "";
      } else {
        group += char;
      }
    } else if (["[", "{"].includes(char)) {
      currentGroupOpener = char as "[" | "{";
    } else {
      output.push(char);
    }
  }

  output.forEach(assertSupported);
  return output;
}

function assertSupported(character: string): never | void {
  if (/^\/.+/u.exec(character) || /.+>[\d]*\/?$/u.exec(character)) {
    throw new Error("Unsupported keyboard input");
  }
}

function matchingBrace(opener: "[" | "{"): "]" | "}" {
  return opener === "{" ? "}" : "]";
}
