import { describe, expect, it } from "bun:test";
import { Animated } from "@/animate/animate.animated.tsx";
import { Delay } from "@/animate/animate.delay.tsx";
import { readScope } from "@/animate/animate.scope.ts";
import { Stagger } from "@/animate/animate.stagger.tsx";
import type { AnimationScope } from "@/animate/animate.types.ts";
import { resolveTree } from "@/resolve/resolve.renderer.ts";
import type { ElementNode } from "@/resolve/resolve.types.ts";
import { fade } from "@/test/test.animations.ts";
import { Expected, Shape, Timing } from "@/test/test.constants.ts";
import { resolvePanel } from "@/test/test.panel.tsx";
import { elementsOf, scopesOf, styleOf } from "@/test/test.tree.ts";

describe("'useTimeline' and 'useAnimationScope'.", (): void => {
  it("Adds the delay of every enclosing scope.", (): void => {
    const begins: readonly number[] = scopesOf(resolvePanel()).map(
      (scope: AnimationScope): number => scope.beginMs,
    );

    expect(begins).toEqual([...Expected.panelBegins]);
  });

  it("Offsets each 'Stagger' child by its index.", (): void => {
    const root: ElementNode = resolveTree(
      <Stagger
        animation={fade(Timing.nav)}
        stepMs={120}
      >
        <div key="a" />
        <div key="b" />
        <div key="c" />
      </Stagger>,
    );

    expect(
      scopesOf(root).map((scope: AnimationScope): number => scope.beginMs),
    ).toEqual([...Expected.staggerBegins]);
  });

  it("Shifts a subtree's timeline with 'Delay' without adding a scope.", (): void => {
    const root: ElementNode = resolveTree(
      <div>
        <Delay byMs={300}>
          <Animated animation={fade(Timing.short)}>
            <div />
          </Animated>
        </Delay>
        <Animated animation={fade(0)}>
          <div />
        </Animated>
      </div>,
    );

    expect(
      scopesOf(root).map((scope: AnimationScope): number => scope.beginMs),
    ).toEqual([...Expected.delayBegins]);
    expect(elementsOf(root)).toHaveLength(2);
  });

  it("Keeps the styling on the scope element itself.", (): void => {
    const root: ElementNode = resolveTree(
      <Animated
        animation={fade(0)}
        style={{ marginBottom: 8 }}
        tw="rounded-lg"
      >
        <div />
      </Animated>,
    );

    expect(readScope(root.props)).toBeDefined();
    expect(root.props.tw).toBe("rounded-lg");
    expect(styleOf(root).marginBottom).toBe(Shape.marginBottom);
  });
});
