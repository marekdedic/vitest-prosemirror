// The text node at a DOM position -- the one the position is inside, or the one that
// starts there. Null when the position lies between nodes that hold no text, such as a
// hard break, an image or ProseMirror's empty-block placeholder <br>.
export const characterDataAt = (
  node: Node,
  offset: number,
): { offset: number; target: CharacterData } | null => {
  if (node instanceof CharacterData) {
    return { offset, target: node };
  }
  const after = node.childNodes[offset] as Node | undefined;
  if (after instanceof CharacterData) {
    return { offset: 0, target: after };
  }
  return null;
};
