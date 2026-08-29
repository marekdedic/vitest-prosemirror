// ProseMirror measures the DOM when handling cursor motion keys, but jsdom has no rects for a Range.
// Zero-sized rects make those measurements inconclusive, which ProseMirror handles gracefully.
export const mockRangeRects = (): void => {
  const zeroRect = (): DOMRect => new DOMRect(0, 0, 0, 0);
  const emptyRectList = (): DOMRectList => [] as unknown as DOMRectList;

  const rangePrototype = Range.prototype as Partial<Range>;
  if (typeof rangePrototype.getBoundingClientRect !== "function") {
    Range.prototype.getBoundingClientRect = zeroRect;
  }
  if (typeof rangePrototype.getClientRects !== "function") {
    Range.prototype.getClientRects = emptyRectList;
  }
};
