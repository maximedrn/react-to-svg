import { describe, expect, it } from "bun:test";
import is from "@sindresorhus/is";
import { readScope } from "@/animate/animate.scope.ts";
import { type Measurement, measureTree } from "@/layer/layer.measure.ts";
import { projectBase, projectScope } from "@/layer/layer.project.ts";
import type { ScopeNode } from "@/layer/layer.types.ts";
import type { ElementNode } from "@/resolve/resolve.types.ts";
import { Config } from "@/test/test.constants.ts";
import { resolvePanel } from "@/test/test.panel.tsx";
import { flatten, scopesOf, styleOf } from "@/test/test.tree.ts";

describe("'projectBase' and 'projectScope'.", (): void => {
  it("Pins every animated scope out of the base layer.", async (): Promise<void> => {
    const root: ElementNode = resolvePanel();
    const { boxes, scopes }: Measurement = await measureTree(root, Config);
    const base: ElementNode = projectBase(root, boxes);

    for (const element of flatten(base)) {
      if (!is.undefined(readScope(element.props))) {
        expect(styleOf(element).opacity).toBe(0);
        expect(element.children).toHaveLength(0);
      }
    }
    expect(scopesOf(base)).toHaveLength(scopes.length);
  });

  it("Gives a pinned scope the size it was measured at.", async (): Promise<void> => {
    const root: ElementNode = resolvePanel();
    const { boxes, scopes }: Measurement = await measureTree(root, Config);
    const outer: ScopeNode | undefined = scopes[0];
    const pinned: ElementNode | undefined = flatten(
      projectBase(root, boxes),
    ).find(
      (element: ElementNode): boolean =>
        readScope(element.props)?.beginMs === outer?.scope.beginMs,
    );

    expect(styleOf(pinned ?? { children: [], props: {}, type: "" }).width).toBe(
      outer?.box.width,
    );
  });

  it("Keeps the scope subtree and strips the paint of its ancestors.", async (): Promise<void> => {
    const root: ElementNode = resolvePanel();
    const { boxes, scopes }: Measurement = await measureTree(root, Config);
    const outer: ScopeNode | undefined = scopes[0];

    if (is.undefined(outer)) {
      throw new Error("Expected at least one scope");
    }
    const projected: ElementNode = projectScope(root, outer, boxes);

    expect(styleOf(projected).backgroundColor).toBe("transparent");
    expect(styleOf(projected).opacity).toBeUndefined();

    const target: ElementNode | undefined = flatten(projected).find(
      (element: ElementNode): boolean =>
        readScope(element.props)?.beginMs === outer.scope.beginMs,
    );

    expect(target?.children.length).toBeGreaterThan(0);
  });

  it("Pins a nested scope out of its parent's layer.", async (): Promise<void> => {
    const root: ElementNode = resolvePanel();
    const { boxes, scopes }: Measurement = await measureTree(root, Config);
    const outer: ScopeNode | undefined = scopes[0];
    const inner: ScopeNode | undefined = outer?.children[0];

    if (is.undefined(outer) || is.undefined(inner)) {
      throw new Error("Expected a nested scope");
    }
    const nested: ElementNode | undefined = flatten(
      projectScope(root, outer, boxes),
    ).find(
      (element: ElementNode): boolean =>
        readScope(element.props)?.beginMs === inner.scope.beginMs,
    );

    expect(
      styleOf(nested ?? { children: [], props: {}, type: "" }).opacity,
    ).toBe(0);
    expect(nested?.children).toHaveLength(0);
  });

  it("Leaves the source tree untouched.", async (): Promise<void> => {
    const root: ElementNode = resolvePanel();
    const { boxes, scopes }: Measurement = await measureTree(root, Config);
    const before: number = flatten(root).length;

    projectBase(root, boxes);
    for (const scope of scopes) {
      projectScope(root, scope, boxes);
    }

    expect(flatten(root)).toHaveLength(before);
    expect(styleOf(root).opacity).toBeUndefined();
  });
});
