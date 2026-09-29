import { Children, type FC, type ReactNode } from "react";
import { Animated } from "@/animate/animate.animated.tsx";
import { WrapperStyle } from "@/animate/animate.constants.ts";
import type { StaggerProps } from "@/animate/animate.types.ts";

/**
 * Applies `animation` to every direct child, offsetting each one by `stepMs`.
 * The offsets stack on top of whatever timeline this element inherits.
 *
 * @param {StaggerProps} props - The animation, the per-child step, the children
 *   and styling.
 *
 * @returns {ReactNode} A row/column of individually animated children.
 */
const Stagger: FC<StaggerProps> = (props: StaggerProps): ReactNode => {
  const items: readonly ReactNode[] = Children.toArray(props.children);

  return (
    <div
      className={props.className}
      style={{ ...WrapperStyle, ...props.style }}
      tw={props.tw}
    >
      {items.map((child: ReactNode, index: number): ReactNode => (
        <Animated
          animation={{
            ...props.animation,
            delayMs: props.animation.delayMs + index * props.stepMs,
          }}
          key={`stagger-${String(index)}`}
        >
          {child}
        </Animated>
      ))}
    </div>
  );
};

export { Stagger };
