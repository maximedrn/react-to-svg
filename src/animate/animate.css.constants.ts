/**
 * The CSS property group a numeric channel compiles into. Referenced instead of
 * the raw `"filter"` / `"transform"` strings.
 */
const ChannelGroup = {
  filter: "filter",
  transform: "transform",
} as const;

type ChannelGroup = (typeof ChannelGroup)[keyof typeof ChannelGroup];

/**
 * The CSS unit a numeric channel's value carries. Referenced instead of the raw
 * `""` / `"deg"` / `"px"` strings.
 */
const ChannelUnit = {
  degrees: "deg",
  none: "",
  pixels: "px",
} as const;

type ChannelUnit = (typeof ChannelUnit)[keyof typeof ChannelUnit];

/**
 * The CSS functions the compiler emits: one per numeric channel, plus the
 * `perspective` wrapper for 3D transforms. Kept in one place so a spec (or the
 * compiler) references `CssFunction.rotateX`, never a bare string.
 */
const CssFunction = {
  blur: "blur",
  brightness: "brightness",
  contrast: "contrast",
  grayscale: "grayscale",
  hueRotate: "hue-rotate",
  perspective: "perspective",
  rotate: "rotate",
  rotateX: "rotateX",
  rotateY: "rotateY",
  saturate: "saturate",
  scale: "scale",
  skewX: "skewX",
  skewY: "skewY",
  translateX: "translateX",
  translateY: "translateY",
  translateZ: "translateZ",
} as const;

type CssFunction = (typeof CssFunction)[keyof typeof CssFunction];

/**
 * The value that leaves a channel unchanged: `additive` (`0`) for offset
 * channels (translate, rotate, skew, blur, hue-rotate, grayscale) and
 * `multiplicative` (`1`) for scaling ones (scale, brightness, contrast,
 * saturate). Referenced instead of a bare `0` / `1`.
 */
const Identity = {
  additive: 0,
  multiplicative: 1,
} as const;

type Identity = (typeof Identity)[keyof typeof Identity];

/**
 * How each numeric {@link Keyframe} channel renders into CSS: which function it
 * belongs to, in which property group, its unit, and the value that is a
 * no-op.
 */
interface ChannelSpec {
  readonly css: CssFunction;
  readonly group: ChannelGroup;
  readonly identity: Identity;
  readonly unit: ChannelUnit;
}

/**
 * The numeric channels, keyed by name so call sites reference the key (e.g.
 * `NumericChannels.rotateX`) instead of a bare string. The declaration order is
 * the order they compose inside `transform` (first) then `filter` (second): CSS
 * applies transform functions left to right, so it is significant — biome's
 * key-sorting assist is disabled for this file to preserve it.
 */
const NumericChannels = {
  blur: "blur",
  brightness: "brightness",
  contrast: "contrast",
  grayscale: "grayscale",
  hueRotate: "hueRotate",
  rotate: "rotate",
  rotateX: "rotateX",
  rotateY: "rotateY",
  saturate: "saturate",
  scale: "scale",
  skewX: "skewX",
  skewY: "skewY",
  translateX: "translateX",
  translateY: "translateY",
  translateZ: "translateZ",
} as const;

type NumericChannel = keyof typeof NumericChannels;

/**
 * Maps each numeric channel to its CSS function, group, unit and identity.
 */
const ChannelSpecs: Readonly<Record<NumericChannel, ChannelSpec>> = {
  blur: {
    css: CssFunction.blur,
    group: ChannelGroup.filter,
    identity: Identity.additive,
    unit: ChannelUnit.pixels,
  },
  brightness: {
    css: CssFunction.brightness,
    group: ChannelGroup.filter,
    identity: Identity.multiplicative,
    unit: ChannelUnit.none,
  },
  contrast: {
    css: CssFunction.contrast,
    group: ChannelGroup.filter,
    identity: Identity.multiplicative,
    unit: ChannelUnit.none,
  },
  grayscale: {
    css: CssFunction.grayscale,
    group: ChannelGroup.filter,
    identity: Identity.additive,
    unit: ChannelUnit.none,
  },
  hueRotate: {
    css: CssFunction.hueRotate,
    group: ChannelGroup.filter,
    identity: Identity.additive,
    unit: ChannelUnit.degrees,
  },
  rotate: {
    css: CssFunction.rotate,
    group: ChannelGroup.transform,
    identity: Identity.additive,
    unit: ChannelUnit.degrees,
  },
  rotateX: {
    css: CssFunction.rotateX,
    group: ChannelGroup.transform,
    identity: Identity.additive,
    unit: ChannelUnit.degrees,
  },
  rotateY: {
    css: CssFunction.rotateY,
    group: ChannelGroup.transform,
    identity: Identity.additive,
    unit: ChannelUnit.degrees,
  },
  saturate: {
    css: CssFunction.saturate,
    group: ChannelGroup.filter,
    identity: Identity.multiplicative,
    unit: ChannelUnit.none,
  },
  scale: {
    css: CssFunction.scale,
    group: ChannelGroup.transform,
    identity: Identity.multiplicative,
    unit: ChannelUnit.none,
  },
  skewX: {
    css: CssFunction.skewX,
    group: ChannelGroup.transform,
    identity: Identity.additive,
    unit: ChannelUnit.degrees,
  },
  skewY: {
    css: CssFunction.skewY,
    group: ChannelGroup.transform,
    identity: Identity.additive,
    unit: ChannelUnit.degrees,
  },
  translateX: {
    css: CssFunction.translateX,
    group: ChannelGroup.transform,
    identity: Identity.additive,
    unit: ChannelUnit.pixels,
  },
  translateY: {
    css: CssFunction.translateY,
    group: ChannelGroup.transform,
    identity: Identity.additive,
    unit: ChannelUnit.pixels,
  },
  translateZ: {
    css: CssFunction.translateZ,
    group: ChannelGroup.transform,
    identity: Identity.additive,
    unit: ChannelUnit.pixels,
  },
} as const;

/**
 * The color channels, keyed by name so call sites reference the key. These are
 * string-valued and animate by cross-fading rasters (a bitmap layer can't be
 * recolored in place), so they never appear in a CSS `@keyframes` rule.
 */
const ColorChannels = {
  backgroundColor: "backgroundColor",
  borderColor: "borderColor",
  color: "color",
} as const;

type ColorChannel = keyof typeof ColorChannels;

/**
 * Fixed CSS tokens the compiler emits that aren't tied to a channel: the
 * `animation` shorthand keywords, the time unit, and the `opacity` property.
 * Referenced by key instead of written as bare strings.
 */
const Css = {
  both: "both",
  infinite: "infinite",
  milliseconds: "ms",
  opacity: "opacity",
} as const;

/**
 * Numeric constants used when formatting values for CSS: the decimals `num`
 * keeps, and the factor turning a `0..1` keyframe position into a `0..100%`
 * selector.
 */
const Format = {
  decimals: 4,
  percent: 100,
} as const;

export type { ChannelSpec, ColorChannel, NumericChannel };
export {
  ChannelGroup,
  ChannelSpecs,
  ChannelUnit,
  ColorChannels,
  Css,
  CssFunction,
  Format,
  Identity,
  NumericChannels,
};
