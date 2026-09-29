import { type FC, type ReactNode, useMemo } from "react";
import { WrapperStyle } from "@/animate/animate.constants.ts";
import { TimelineContext } from "@/animate/animate.context.ts";
import {
  type AnimationScopeResult,
  useAnimationScope,
} from "@/animate/animate.hooks.ts";
import type { AnimatedProps } from "@/animate/animate.types.ts";
import type { StyleObject } from "@/resolve/resolve.types.ts";

/**
 * Marks its subtree as an animated scope.
 *
 * `className`, `style` and `tw` are forwarded, so the scope can _be_ the styled
 * element instead of adding a layer to the layout. Children inherit the
 * resolved timeline, which is what makes nested scopes compose.
 *
 * @param {AnimatedProps} props - The animation to apply, the children, and
 *   optional styling.
 *
 * @returns {ReactNode} A scope element wrapping the children.
 */
const Animated: FC<AnimatedProps> = (props: AnimatedProps): ReactNode => {
  const resolved: AnimationScopeResult = useAnimationScope(props.animation);
  const style: StyleObject = useMemo<StyleObject>(
    (): StyleObject => ({ ...WrapperStyle, ...props.style }),
    [props.style],
  );

  return (
    <TimelineContext.Provider value={resolved.childTimeline}>
      <div
        {...resolved.scopeProps}
        className={props.className}
        style={style}
        tw={props.tw}
      >
        {props.children}
      </div>
    </TimelineContext.Provider>
  );
};

export { Animated };
