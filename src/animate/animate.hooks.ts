import { useContext, useMemo } from "react";
import { TimelineContext } from "@/animate/animate.context.ts";
import { ScopeProp } from "@/animate/animate.scope.ts";
import type {
  Animation,
  AnimationScope,
  Timeline,
} from "@/animate/animate.types.ts";

/**
 * Props that carry a resolved scope onto an animated element.
 */
interface ScopeProps {
  readonly [ScopeProp]: AnimationScope;
}

/**
 * What {@link useAnimationScope} hands back to a scope component.
 */
interface AnimationScopeResult {
  readonly childTimeline: Timeline;
  readonly scope: AnimationScope;
  readonly scopeProps: ScopeProps;
}

/**
 * Reads the offset accumulated by the enclosing scopes.
 *
 * @returns {Timeline} The inherited timeline.
 */
const useTimeline: () => Timeline = (): Timeline => useContext(TimelineContext);

/**
 * Resolves `animation` against the inherited timeline and returns both the
 * props to spread onto the animated element and the timeline its children
 * should inherit.
 *
 * @param {Animation} animation - The animation to resolve.
 *
 * @returns {AnimationScopeResult} The resolved scope, its props and the child
 *   timeline.
 */
const useAnimationScope: (animation: Animation) => AnimationScopeResult = (
  animation: Animation,
): AnimationScopeResult => {
  const parent: Timeline = useTimeline();

  return useMemo<AnimationScopeResult>((): AnimationScopeResult => {
    const beginMs: number = parent.beginMs + animation.delayMs;
    const scope: AnimationScope = { animation, beginMs };
    return {
      childTimeline: { beginMs },
      scope,
      scopeProps: { [ScopeProp]: scope },
    };
  }, [animation, parent.beginMs]);
};

export type { AnimationScopeResult, ScopeProps };
export { useAnimationScope, useTimeline };
