import { describe, expect, it } from "bun:test";
import is from "@sindresorhus/is";
import { createElement, type FC, type ReactNode } from "react";
import { resolveTree } from "@/resolve/resolve.renderer.ts";
import {
  type ElementNode,
  isTextNode,
  type ResolvedNode,
} from "@/resolve/resolve.types.ts";
import { resolvePanel } from "@/test/test.panel.tsx";
import { elementsOf } from "@/test/test.tree.ts";

describe("'resolveTree'.", (): void => {
  it("Runs the component and returns its single host root.", (): void => {
    const root: ElementNode = resolvePanel();

    expect(root.type).toBe("div");
    expect(elementsOf(root).length).toBeGreaterThan(0);
  });

  it("Leaves a lone text child as the element's own text.", (): void => {
    const root: ElementNode = resolveTree(createElement("div", null, "solo"));
    const only: ResolvedNode | undefined = root.children[0];

    expect(root.children).toHaveLength(1);
    expect(!is.undefined(only) && isTextNode(only) ? only.text : "").toBe(
      "solo",
    );
  });

  it("Wraps sibling text runs so each one becomes a measurable box.", (): void => {
    const root: ElementNode = resolveTree(
      createElement("div", null, "first", "second"),
    );
    const boxes: readonly ElementNode[] = elementsOf(root);
    const head: ElementNode | undefined = boxes[0];

    expect(boxes).toHaveLength(2);
    expect(head?.type).toBe("div");
    expect(head?.children.some(isTextNode)).toBe(true);
  });

  it("Surfaces a failure thrown by the component as a 'ResolveError'.", (): void => {
    const Boom: FC = (): ReactNode => {
      throw new Error("component failed");
    };

    expect((): ElementNode => resolveTree(createElement(Boom))).toThrow(
      "component failed",
    );
  });
});
