import { type FC, type ReactNode, useMemo } from "react";
import { TimelineContext } from "@/animate/animate.context.ts";
import { useTimeline } from "@/animate/animate.hooks.ts";
import type { DelayProps, Timeline } from "@/animate/animate.types.ts";

/**
 * Shifts the timeline its subtree inherits, without marking a scope.
 *
 * Unlike `Animated` it adds no element, no layer and nothing to animate: it
 * only moves the clock, which is what makes it the right tool for grouping
 * independent scopes behind a common offset.
 *
 * @param {DelayProps} props - The offset to add, and the children to shift.
 *
 * @returns {ReactNode} The children under a shifted timeline.
 */
const Delay: FC<DelayProps> = (props: DelayProps): ReactNode => {
  const parent: Timeline = useTimeline();
  const value: Timeline = useMemo<Timeline>(
    (): Timeline => ({ beginMs: parent.beginMs + props.byMs }),
    [parent.beginMs, props.byMs],
  );

  return (
    <TimelineContext.Provider value={value}>
      {props.children}
    </TimelineContext.Provider>
  );
};

export { Delay };
