// Jsdom provides no DataTransferItem
export class DataTransferItemMock implements DataTransferItem {
  public readonly kind = "file";
  public readonly type: string;

  private readonly file: File;

  public constructor(file: File) {
    this.file = file;
    this.type = file.type;
  }

  public getAsFile(): File | null {
    return this.file;
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this -- Mocking another method
  public getAsString(): void {
    // String flavours are carried via getData, not as items.
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this -- Mocking another method
  public webkitGetAsEntry(): FileSystemEntry | null {
    // Filesystem entries are a drag-and-drop concern, out of scope for clipboard testing.
    return null;
  }
}
