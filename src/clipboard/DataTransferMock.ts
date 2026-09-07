import { DataTransferItemMock } from "./DataTransferItemMock";

// Browsers treat the legacy "Text" alias as "text/plain"; ProseMirror's getText reads both.
const normalizeType = (format: string): string =>
  format.toLowerCase() === "text" ? "text/plain" : format.toLowerCase();

// Jsdom provides no DataTransfer
export class DataTransferMock implements DataTransfer {
  public dropEffect: DataTransfer["dropEffect"] = "none";
  public effectAllowed: DataTransfer["effectAllowed"] = "uninitialized";
  public readonly files: FileList;
  public readonly items: DataTransferItemList;

  public get types(): ReadonlyArray<string> {
    return this.files.length > 0
      ? [...this.store.keys(), "Files"]
      : [...this.store.keys()];
  }

  private readonly store = new Map<string, string>();

  public constructor(files: Array<File> = []) {
    this.files = Object.assign([...files], {
      item: (index: number): File | null => files[index] ?? null,
    });
    this.items = Object.assign(
      files.map((file) => new DataTransferItemMock(file)),
      {
        add: (): DataTransferItem | null => null,
        clear: (): void => undefined,
        remove: (): void => undefined,
      },
    );
  }

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
