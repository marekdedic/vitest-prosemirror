// Grapheme segmentation is locale-independent, so the default locale is fine.
const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

export const graphemeBoundary = (
  text: string,
  offset: number,
  direction: -1 | 1,
): number | null => {
  const segment = segmenter
    .segment(text)
    .containing(direction > 0 ? offset : offset - 1);
  if (segment === undefined) {
    return null;
  }
  return direction > 0 ? segment.index + segment.segment.length : segment.index;
};
