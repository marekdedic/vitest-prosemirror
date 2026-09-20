import type { DataTransferMock } from "./DataTransferMock";

// Jsdom has no ClipboardEvent
export class ClipboardEventMock extends Event implements ClipboardEvent {
  public readonly clipboardData: DataTransfer;

  public constructor(type: string, clipboardData: DataTransferMock) {
    super(type, { bubbles: true, cancelable: true, composed: true });
    this.clipboardData = clipboardData;
  }
}
