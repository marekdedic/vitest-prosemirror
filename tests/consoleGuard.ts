import { afterEach, beforeEach, type MockInstance, vi } from "vitest";

const spies: Array<[string, MockInstance]> = [];

beforeEach(() => {
  spies.push(
    ["warn", vi.spyOn(console, "warn")],
    ["error", vi.spyOn(console, "error")],
  );
});

afterEach(() => {
  const logged = spies.flatMap(([method, spy]) =>
    spy.mock.calls.map((args) => `console.${method}: ${args.join(" ")}`),
  );
  for (const [, spy] of spies.splice(0)) {
    spy.mockRestore();
  }
  if (logged.length > 0) {
    throw new Error(`The test logged:\n${logged.join("\n")}`);
  }
});
