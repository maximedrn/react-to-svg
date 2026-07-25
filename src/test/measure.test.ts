import { describe, expect, it } from "bun:test";
import { type Measurement, measureTree } from "@/layer/layer.measure.ts";
import type { ScopeNode } from "@/layer/layer.types.ts";
import type { ElementNode } from "@/resolve/resolve.types.ts";
import { Config, Expected, Timing } from "@/test/test.constants.ts";
import { resolvePanel } from "@/test/test.panel.tsx";
import { flatten } from "@/test/test.tree.ts";

describe("'measureTree'.", (): void => {
  it("Assigns a box to every element, keyed by identity.", async (): Promise<void> => {
    const root: ElementNode = resolvePanel();
    const { boxes }: Measurement = await measureTree(root, Config);

    for (const element of flatten(root)) {
      expect(boxes.get(element)).toBeDefined();
    }
  });

  it("Mirrors the component nesting in the scope hierarchy.", async (): Promise<void> => {
    const root: ElementNode = resolvePanel();
    const { scopes }: Measurement = await measureTree(root, Config);
    const outer: ScopeNode | undefined = scopes[0];

    expect(scopes).toHaveLength(Expected.scopeCount);
    expect(outer?.scope.beginMs).toBe(0);
    expect(outer?.children).toHaveLength(1);
    expect(outer?.children[0]?.scope.beginMs).toBe(Timing.headline);
  });

  it("Measures a scope box that matches its content.", async (): Promise<void> => {
    const root: ElementNode = resolvePanel();
    const { scopes }: Measurement = await measureTree(root, Config);
    const outer: ScopeNode | undefined = scopes[0];

    expect(outer?.box.width).toBeGreaterThan(0);
    expect(outer?.box.height).toBeGreaterThan(0);
  });
});
