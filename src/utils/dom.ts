export const findLastCharacterDataNode = (node: Node): CharacterData | null => {
  if (node instanceof CharacterData) {
    return node;
  }
  for (const child of Array.from(node.childNodes).reverse()) {
    const textNode = findLastCharacterDataNode(child);
    if (textNode !== null) {
      return textNode;
    }
  }
  return null;
};
