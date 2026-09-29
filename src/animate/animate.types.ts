import type { ReactNode } from "react";
import type { StyleObject } from "@/resolve/resolve.types.ts";

/**
 * One point in an animation. Every channel is optional and interpolated from
 * the last keyframe that set it. Numeric channels compile to CSS `transform` /
 * `filter` / `opacity`; the color channels are cross-faded via multi-raster
 * (see `layer.project`) because a rasterized layer's paint cannot be recolored
 * in place. See `animate.css.constants.ts` for how each maps to CSS.
 */
interface Keyframe {
  /**
   * Position in the animation, from `0` (start) to `1` (end).
   */
  readonly at: number;
  readonly backgroundColor?: string;
  readonly blur?: number;
  readonly borderColor?: string;
  readonly brightness?: number;
  readonly color?: string;
  readonly contrast?: number;
  readonly grayscale?: number;
  readonly hueRotate?: number;
  readonly opacity?: number;
  readonly rotate?: number;
  readonly rotateX?: number;
  readonly rotateY?: number;
  readonly saturate?: number;
  readonly scale?: number;
  readonly skewX?: number;
  readonly skewY?: number;
  readonly translateX?: number;
  readonly translateY?: number;
  readonly translateZ?: number;
}

interface Animation {
  readonly delayMs: number;
  readonly durationMs: number;
  /**
   * Any CSS `<easing-function>` — a keyword (`"linear"`, `"ease-out"`), a
   * `cubic-bezier(...)`, or a sampled `linear(...)`. Emitted verbatim into the
   * compiled `animation` shorthand, so the caller has full control.
   */
  readonly easing: string;
  readonly keyframes: readonly Keyframe[];
  /**
   * The z-distance, in pixels, of the 3D perspective. Only applied when a
   * keyframe uses `rotateX`, `rotateY` or `translateZ`; ignored otherwise.
   */
  readonly perspective: number;
  /**
   * `0` plays once; `Number.POSITIVE_INFINITY` loops forever.
   */
  readonly repeat: number;
}

/**
 * A resolved animation: `beginMs` already includes every ancestor's delay, so a
 * scope can be compiled to CSS without knowing where it sits in the tree.
 */
interface AnimationScope {
  readonly animation: Animation;
  readonly beginMs: number;
}

interface Timeline {
  /**
   * Accumulated delay contributed by the enclosing scopes.
   */
  readonly beginMs: number;
}

/**
 * Props for the `Animated` scope component.
 */
interface AnimatedProps {
  readonly animation: Animation;
  readonly children: ReactNode;
  readonly className?: string;
  readonly style?: StyleObject;
  readonly tw?: string;
}

/**
 * Props for the `Delay` timeline-shifting component.
 */
interface DelayProps {
  readonly byMs: number;
  readonly children: ReactNode;
}

/**
 * Props for the `Stagger` component.
 */
interface StaggerProps {
  readonly animation: Animation;
  readonly children: ReactNode;
  readonly className?: string;
  readonly stepMs: number;
  readonly style?: StyleObject;
  readonly tw?: string;
}

export type {
  AnimatedProps,
  Animation,
  AnimationScope,
  DelayProps,
  Keyframe,
  StaggerProps,
  Timeline,
};
