import type { Animation, AnimationScope } from "@/animate/animate.types.ts";
import type { LayerTree, ScopeNode } from "@/layer/layer.types.ts";
import { fade, slide } from "@/test/test.animations.ts";
import {
  SampleBox,
  SampleLayer,
  Shape,
  Source,
  Timing,
} from "@/test/test.constants.ts";

const scopeOf: (beginMs: number, animation: Animation) => AnimationScope = (
  beginMs: number,
  animation: Animation,
): AnimationScope => ({
  animation,
  beginMs,
});

const asScope: (
  beginMs: number,
  animation: Animation,
  children?: readonly ScopeNode[],
) => ScopeNode = (
  beginMs: number,
  animation: Animation,
  children: readonly ScopeNode[] = [],
): ScopeNode => ({
  box: SampleBox,
  children,
  node: Source,
  scope: { animation, beginMs },
});

const layerTree: () => LayerTree = (): LayerTree => {
  const inner: ScopeNode = asScope(Timing.headline, fade(Timing.headline));

  return {
    children: [
      {
        children: [{ children: [], layer: SampleLayer, scope: inner }],
        layer: SampleLayer,
        scope: asScope(0, slide(Shape.slideDistance), [inner]),
      },
    ],
    layer: SampleLayer,
  };
};

export { asScope, layerTree, scopeOf };
