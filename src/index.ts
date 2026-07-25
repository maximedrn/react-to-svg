/**
 * React-to-svg — turn a React component into a single animated, theme-aware SVG
 * string. Resolve → measure → project → rasterize → compose, all without ever
 * parsing markup. Rendering is an Effect; I/O (writing, serving) is left to
 * you.
 *
 * @packageDocumentation
 */

export { Animated } from "@/animate/animate.animated.tsx";
export { Easing } from "@/animate/animate.constants.ts";
export { Delay } from "@/animate/animate.delay.tsx";
export type {
  AnimationScopeResult,
  ScopeProps,
} from "@/animate/animate.hooks.ts";
export { useAnimationScope, useTimeline } from "@/animate/animate.hooks.ts";
export { Stagger } from "@/animate/animate.stagger.tsx";
export type {
  AnimatedProps,
  Animation,
  AnimationScope,
  DelayProps,
  Keyframe,
  StaggerProps,
  Timeline,
} from "@/animate/animate.types.ts";
export { ComposeError } from "@/compose/compose.errors.ts";
export { MeasureError, RasterizeError } from "@/layer/layer.errors.ts";
export { RenderService } from "@/render.context.ts";
export type { RenderError } from "@/render.errors.ts";
export { RenderServiceLive } from "@/render.factory.ts";
export type { IRenderService } from "@/render.interface.ts";
export { makeRenderService } from "@/render.service.ts";
export type {
  FontConfig,
  RenderableComponent,
  RenderOptions,
} from "@/render.types.ts";
export { FontStyle, FontWeight, ThemeVariant } from "@/render.types.ts";
export { ResolveError } from "@/resolve/resolve.errors.ts";
