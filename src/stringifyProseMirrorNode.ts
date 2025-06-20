import type { Mark, Node } from "prosemirror-model";

import stringifyObject from "stringify-object";

function getMarks(marks: ReadonlyArray<Mark>, origContent: string): string {
  let content = `'${origContent}'`;

  for (const mark of [...marks].reverse()) {
    const hasAttrs = Object.keys(mark.attrs).length > 0;
    const items: Array<string> = [content];

    if (hasAttrs) {
      items.unshift(
        stringifyObject(mark.attrs, {
          indent: "  ",
          inlineCharacterLimit: 1000,
        }),
      );
    }

    content = `${mark.type.name}(${items.join(", ")})`;
  }

  return content;
}

const renamedTypes: Record<string, string> = {
  hardBreak: "br",
  heading: "h",
  horizontalRule: "hr",
  paragraph: "p",
};

export function stringifyProseMirrorNode(node: Node, indentation = ""): string {
  if (node.type.name === "text") {
    return `${indentation}${getMarks(node.marks, node.text ?? "")}`;
  }

  const type = renamedTypes[node.type.name] ?? node.type.name;
  const content: Array<string> = [];
  const nextIndentation = `${indentation}  `;

  if (Object.keys(node.attrs).length > 0) {
    content.push(
      `${nextIndentation}${stringifyObject(node.attrs, { indent: "  ", inlineCharacterLimit: 1000 })},`,
    );
  }

  node.content.forEach((item) => {
    content.push(`${stringifyProseMirrorNode(item, nextIndentation)},`);
  });

  if (content.length === 0) {
    return `${indentation}${type}()`;
  }

  if (content.length === 1 && node.content.firstChild?.type.name === "text") {
    return `${indentation}${type}(${stringifyProseMirrorNode(node.content.firstChild, "")})`;
  }

  return `${indentation}${type}(\n${content.join("\n")}\n${indentation})`;
}
