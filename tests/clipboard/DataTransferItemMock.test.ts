import { describe, expect, test } from "vitest";

import { DataTransferItemMock } from "../../src/clipboard/DataTransferItemMock";

describe("DataTransferItemMock", () => {
  test("should expose a file kind and its MIME type", () => {
    const file = new File(["x"], "cat.png", { type: "image/png" });
    const item = new DataTransferItemMock(file);

    expect(item.kind).toBe("file");
    expect(item.type).toBe("image/png");
  });

  test("should return the file from getAsFile", () => {
    const file = new File(["x"], "cat.png", { type: "image/png" });
    const item = new DataTransferItemMock(file);

    expect(item.getAsFile()).toBe(file);
  });

  test("should stub the drag-only members", () => {
    const item = new DataTransferItemMock(new File([], "cat.png"));

    expect(() => {
      item.getAsString();
    }).not.toThrow();
    expect(item.webkitGetAsEntry()).toBeNull();
  });
});
