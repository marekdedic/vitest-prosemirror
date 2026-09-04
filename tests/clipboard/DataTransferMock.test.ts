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

  test("should expose empty files and items", () => {
    const data = new DataTransferMock();

    expect(data.files).toHaveLength(0);
    expect(data.items).toHaveLength(0);
  });
});
