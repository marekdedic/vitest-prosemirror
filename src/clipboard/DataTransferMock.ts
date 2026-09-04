// Browsers treat the legacy "Text" alias as "text/plain"; ProseMirror's getText reads both.
const normalizeType = (format: string): string =>
  format.toLowerCase() === "text" ? "text/plain" : format.toLowerCase();

// Jsdom provides no DataTransfer
export class DataTransferMock implements DataTransfer {
  public dropEffect: DataTransfer["dropEffect"] = "none";
  public effectAllowed: DataTransfer["effectAllowed"] = "uninitialized";
  public readonly files: FileList = Object.assign([] as Array<File>, {
    item: (): File | null => null,
  });
  public readonly items: DataTransferItemList = Object.assign(
    [] as Array<DataTransferItem>,
    {
      add: (): DataTransferItem | null => null,
      clear: (): void => undefined,
      remove: (): void => undefined,
    },
  );

  public get types(): ReadonlyArray<string> {
    return [...this.store.keys()];
  }

  private readonly store = new Map<string, string>();

  public clearData(format?: string): void {
    if (format === undefined) {
      this.store.clear();
    } else {
      this.store.delete(normalizeType(format));
    }
  }

  public getData(format: string): string {
    return this.store.get(normalizeType(format)) ?? "";
  }

  public setData(format: string, data: string): void {
    this.store.set(normalizeType(format), data);
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this -- Mocking another method
  public setDragImage(): void {
    // Drag-and-drop is out of scope for clipboard testing.
  }
}
