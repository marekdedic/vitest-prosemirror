import { describe, expect, test } from "vitest";

import { DataTransferMock } from "../../src/clipboard/DataTransferMock";

describe("DataTransferMock", () => {
  test("should round-trip data by MIME type", () => {
    const data = new DataTransferMock();
    data.setData("text/html", "<p>x</p>");
    data.setData("text/plain", "x");

    expect(data.getData("text/html")).toBe("<p>x</p>");
    expect(data.getData("text/plain")).toBe("x");
  });

  test("should return an empty string for a missing type", () => {
    const data = new DataTransferMock();

    expect(data.getData("text/html")).toBe("");
  });

  test("should treat the legacy 'Text' alias as text/plain", () => {
    const data = new DataTransferMock();
    data.setData("text/plain", "x");

    expect(data.getData("Text")).toBe("x");
  });

  test("should list the stored types", () => {
    const data = new DataTransferMock();
    data.setData("text/plain", "x");
    data.setData("text/html", "<p>x</p>");

    expect(data.types).toStrictEqual(["text/plain", "text/html"]);
  });

  test("should clear a single type", () => {
    const data = new DataTransferMock();
    data.setData("text/plain", "x");
    data.setData("text/html", "<p>x</p>");

    data.clearData("text/plain");

    expect(data.types).toStrictEqual(["text/html"]);
  });

  test("should clear all data", () => {
    const data = new DataTransferMock();
    data.setData("text/plain", "x");

    data.clearData();

    expect(data.types).toStrictEqual([]);
  });

  test("should expose empty files and items by default", () => {
    const data = new DataTransferMock();

    expect(data.files).toHaveLength(0);
    expect(data.items).toHaveLength(0);
    expect(data.files.item(0)).toBeNull();
  });

  test("should not report the Files type without files", () => {
    const data = new DataTransferMock();
    data.setData("text/plain", "x");

    expect(data.types).not.toContain("Files");
  });

  test("should carry files passed to the constructor", () => {
    const file = new File(["x"], "cat.png", { type: "image/png" });
    const data = new DataTransferMock([file]);

    expect(data.files).toHaveLength(1);
    expect(data.files[0]).toBe(file);
    expect(data.files.item(0)).toBe(file);
    expect(data.files.item(1)).toBeNull();
  });

  test("should expose the files as items", () => {
    const file = new File(["x"], "cat.png", { type: "image/png" });
    const data = new DataTransferMock([file]);

    expect(data.items).toHaveLength(1);
    expect(data.items[0].kind).toBe("file");
    expect(data.items[0].getAsFile()).toBe(file);
  });

  test("should report the Files type when files are present", () => {
    const data = new DataTransferMock([new File(["x"], "cat.png")]);

    expect(data.types).toContain("Files");
  });

  test("should stub the read-only DataTransferItemList members", () => {
    const data = new DataTransferMock([new File(["x"], "cat.png")]);

    expect(data.items.add(new File(["y"], "dog.png"))).toBeNull();
    expect(() => {
      data.items.clear();
    }).not.toThrow();
  });

  test("should throw when removing from the read-only DataTransferItemList", () => {
    const data = new DataTransferMock([new File(["x"], "cat.png")]);

    expect(() => {
      data.items.remove(0);
    }).toThrow(DOMException);
  });

  test("should throw from the drag-only setDragImage", () => {
    const data = new DataTransferMock();

    expect(() => {
      data.setDragImage();
    }).toThrow(/drag-and-drop/u);
  });
});
