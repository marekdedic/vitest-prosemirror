type UsableMutationRecord = Omit<
  MutationRecord,
  "addedNodes" | "removedNodes"
> & {
  addedNodes: Array<Node>;
  removedNodes: Array<Node>;
};

export class MutationObserverMock implements MutationObserver {
  private static readonly activeObservers: Map<Node, MutationObserverMock> =
    new Map<Node, MutationObserverMock>();

  private readonly callback: MutationCallback;
  private target: Node | undefined;

  public constructor(callback: MutationCallback) {
    this.callback = callback;
    this.target = undefined;
  }

  public static createMutation(
    target: Node,
    mutationRecords: Array<UsableMutationRecord>,
  ): void {
    const observer = MutationObserverMock.activeObservers.get(target);
    if (observer === undefined) {
      return;
    }
    observer.callback(
      mutationRecords as unknown as Array<MutationRecord>,
      observer,
    );
  }

  public disconnect(): void {
    if (this.target !== undefined) {
      MutationObserverMock.activeObservers.delete(this.target);
    }
    this.target = undefined;
  }

  public observe(target: Node): void {
    this.target = target;
    MutationObserverMock.activeObservers.set(target, this);
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this -- Mocking another method
  public takeRecords(): Array<MutationRecord> {
    return [];
  }
}

export type { UsableMutationRecord };
