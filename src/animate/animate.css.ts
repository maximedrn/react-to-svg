import is from "@sindresorhus/is";
import type { CSSProperties } from "react";
import { Easing } from "@/animate/animate.constants.ts";
import {
  ChannelGroup,
  type ChannelSpec,
  ChannelSpecs,
  ChannelUnit,
  ColorChannels,
  Css,
  CssFunction,
  Format,
  Identity,
  type NumericChannel,
  NumericChannels,
} from "@/animate/animate.css.constants.ts";
import type { AnimationScope, Keyframe } from "@/animate/animate.types.ts";
import type {
  Box,
  CompiledAnimation,
  CrossFadeLayer,
  LayerTree,
  ScopeNode,
} from "@/layer/layer.types.ts";

/**
 * One color state of a scope: its position and the colors to apply.
 */
interface ColorStop {
  readonly at: number;
  readonly colors: Readonly<Record<string, string>>;
}

/**
 * Formats a number for CSS, dropping floating-point noise.
 *
 * @param {number} value - The value to format.
 *
 * @returns {string} The value with at most four decimals, trimmed.
 */
const num: (value: number) => string = (value: number): string =>
  String(Number(value.toFixed(Format.decimals)));

/**
 * Formats a length/angle, dropping the unit for zero (`0px` → `0`) to shave the
 * output.
 *
 * @param {number} value - The value to format.
 * @param {string} unit - The unit to append when the value is non-zero.
 *
 * @returns {string} The value with its unit, or a bare `0`.
 */
const dimension: (value: number, unit: string) => string = (
  value: number,
  unit: string,
): string => (value === 0 ? String(value) : `${num(value)}${unit}`);

/**
 * Formats a duration in milliseconds for the `animation` shorthand.
 *
 * @param {number} ms - The number of milliseconds.
 *
 * @returns {string} The value suffixed with `ms`.
 */
const time: (ms: number) => string = (ms: number): string =>
  `${num(ms)}${Css.milliseconds}`;

/**
 * Ensures the series spans the full `[0, 1]` range CSS keyframes expect.
 *
 * @param {readonly Keyframe[]} keyframes - The authored keyframes, in any
 *   order.
 *
 * @returns {readonly Keyframe[]} The sorted keyframes, padded to `0` and `1`.
 */
const normalize: (keyframes: readonly Keyframe[]) => readonly Keyframe[] = (
  keyframes: readonly Keyframe[],
): readonly Keyframe[] => {
  const sorted: Keyframe[] = [...keyframes].sort(
    (a: Keyframe, b: Keyframe): number => a.at - b.at,
  );
  const first: Keyframe | undefined = sorted.at(0);
  const last: Keyframe | undefined = sorted.at(-1);

  if (is.undefined(first) || is.undefined(last)) {
    return [{ at: 0 }, { at: 1 }];
  }
  return [
    ...(first.at > 0 ? [{ ...first, at: 0 }] : []),
    ...sorted,
    ...(last.at < 1 ? [{ ...last, at: 1 }] : []),
  ];
};

/**
 * Whether any keyframe sets `channel`.
 *
 * @param {readonly Keyframe[]} keyframes - The keyframes to inspect.
 * @param {keyof Keyframe} channel - The channel to look for.
 *
 * @returns {boolean} `true` when at least one keyframe sets it.
 */
const uses: (
  keyframes: readonly Keyframe[],
  channel: keyof Keyframe,
) => boolean = (
  keyframes: readonly Keyframe[],
  channel: keyof Keyframe,
): boolean =>
  keyframes.some((frame: Keyframe): boolean => !is.undefined(frame[channel]));

/**
 * Resolves one numeric channel across the series, carrying the last set value.
 *
 * @param {readonly Keyframe[]} keyframes - The keyframes to read.
 * @param {NumericChannel | typeof Css.opacity} channel - The channel to
 *   resolve.
 * @param {number} identity - The value to start from and carry over gaps.
 *
 * @returns {readonly number[]} One value per keyframe.
 */
const carry: (
  keyframes: readonly Keyframe[],
  channel: NumericChannel | typeof Css.opacity,
  identity: number,
) => readonly number[] = (
  keyframes: readonly Keyframe[],
  channel: NumericChannel | typeof Css.opacity,
  identity: number,
): readonly number[] => {
  let last: number = identity;
  return keyframes.map((frame: Keyframe): number => {
    const value: number | undefined = frame[channel];
    if (!is.undefined(value)) last = value;
    return last;
  });
};

/**
 * Compiles one resolved scope into a CSS `@keyframes` rule plus the inline
 * style that plays it. color channels are ignored here — they are cross-faded
 * by the projection step, not animated in CSS. `transform-origin` is set to the
 * measured centre of the box so scale/rotate pivot correctly.
 *
 * @param {AnimationScope} scope - The resolved scope to compile.
 * @param {Box} box - The scope's measured box, for the transform origin.
 * @param {string} name - A document-unique `@keyframes` name.
 *
 * @returns {CompiledAnimation} The keyframes rule and the element style.
 */
const compileScope: (
  scope: AnimationScope,
  box: Box,
  name: string,
) => CompiledAnimation = (
  scope: AnimationScope,
  box: Box,
  name: string,
): CompiledAnimation => {
  const frames: readonly Keyframe[] = normalize(scope.animation.keyframes);
  const channels: readonly NumericChannel[] = Object.values(NumericChannels);
  const transforms: readonly NumericChannel[] = channels.filter(
    (channel: NumericChannel): boolean =>
      ChannelSpecs[channel].group === ChannelGroup.transform &&
      uses(frames, channel),
  );
  const filters: readonly NumericChannel[] = channels.filter(
    (channel: NumericChannel): boolean =>
      ChannelSpecs[channel].group === ChannelGroup.filter &&
      uses(frames, channel),
  );
  const hasOpacity: boolean = uses(frames, Css.opacity);
  const is3D: boolean = transforms.some(
    (channel: NumericChannel): boolean =>
      channel === NumericChannels.rotateX ||
      channel === NumericChannels.rotateY ||
      channel === NumericChannels.translateZ,
  );

  const seriesByChannel: ReadonlyMap<NumericChannel, readonly number[]> =
    new Map(
      [...transforms, ...filters].map(
        (
          channel: NumericChannel,
        ): readonly [NumericChannel, readonly number[]] => [
          channel,
          carry(frames, channel, ChannelSpecs[channel].identity),
        ],
      ),
    );
  const opacitySeries: readonly number[] = hasOpacity
    ? carry(frames, Css.opacity, Identity.multiplicative)
    : [];

  const functionAt: (channel: NumericChannel, index: number) => string = (
    channel: NumericChannel,
    index: number,
  ): string => {
    const spec: ChannelSpec = ChannelSpecs[channel];
    const value: number =
      seriesByChannel.get(channel)?.[index] ?? spec.identity;
    return `${spec.css}(${dimension(value, spec.unit)})`;
  };

  const depth: string = dimension(
    scope.animation.perspective,
    ChannelUnit.pixels,
  );
  const perspective: string = is3D
    ? `${CssFunction.perspective}(${depth})`
    : "";

  const steps: string = frames
    .map((frame: Keyframe, index: number): string => {
      const transform: string = [
        perspective,
        ...transforms.map((channel: NumericChannel): string =>
          functionAt(channel, index),
        ),
      ]
        .filter((token: string): boolean => token !== "")
        .join(" ");
      const filter: string = filters
        .map((channel: NumericChannel): string => functionAt(channel, index))
        .join(" ");
      const opacity: string = hasOpacity
        ? num(opacitySeries[index] ?? Identity.multiplicative)
        : "";
      const declarations: string = [
        transform === "" ? "" : `${ChannelGroup.transform}:${transform}`,
        filter === "" ? "" : `${ChannelGroup.filter}:${filter}`,
        opacity === "" ? "" : `${Css.opacity}:${opacity}`,
      ]
        .filter((declaration: string): boolean => declaration !== "")
        .join(";");
      return declarations === ""
        ? ""
        : `${num(frame.at * Format.percent)}%{${declarations}}`;
    })
    .filter((step: string): boolean => step !== "")
    .join("");

  const iterations: string =
    scope.animation.repeat === Number.POSITIVE_INFINITY
      ? Css.infinite
      : String(scope.animation.repeat + 1);

  const originX: string = dimension(
    box.left + box.width / 2,
    ChannelUnit.pixels,
  );
  const originY: string = dimension(
    box.top + box.height / 2,
    ChannelUnit.pixels,
  );
  const style: CSSProperties = {
    animation: [
      name,
      time(scope.animation.durationMs),
      scope.animation.easing,
      time(scope.beginMs),
      iterations,
      Css.both,
    ].join(" "),
    transformOrigin: `${originX} ${originY}`,
  };

  return { keyframes: `@keyframes ${name}{${steps}}`, style };
};

/**
 * Extracts the color states of a scope — one per keyframe that sets a color
 * channel, with values carried over gaps. Fewer than two states means there is
 * nothing to cross-fade, so an empty list is returned.
 *
 * @param {AnimationScope} scope - The resolved scope.
 *
 * @returns {readonly ColorStop[]} The color stops, or empty when none apply.
 */
const colorStops: (scope: AnimationScope) => readonly ColorStop[] = (
  scope: AnimationScope,
): readonly ColorStop[] => {
  const frames: readonly Keyframe[] = [...scope.animation.keyframes].sort(
    (a: Keyframe, b: Keyframe): number => a.at - b.at,
  );
  const carried: Record<string, string> = {};
  const stops: ColorStop[] = [];
  for (const frame of frames) {
    let touched = false;
    for (const channel of Object.values(ColorChannels)) {
      const value: string | undefined = frame[channel];
      if (is.string(value)) {
        carried[channel] = value;
        touched = true;
      }
    }
    if (touched) stops.push({ at: frame.at, colors: { ...carried } });
  }
  return stops.length >= 2 ? stops : [];
};

/**
 * Compiles the opacity cross-fade for a color-animated scope, painting each
 * color raster over the one before. The first stop is the base — always opaque,
 * so it gets no animation; every later stop starts transparent and fades to
 * opaque across the window from the previous stop to its own, then holds.
 * Because the base stays opaque underneath, coverage is always full and
 * consecutive colors blend without the background showing through.
 *
 * @param {AnimationScope} scope - The resolved scope, for timing.
 * @param {readonly number[]} ats - The stop positions, `0` to `1`, ascending.
 * @param {string} prefix - A unique name prefix for this scope.
 *
 * @returns {readonly (CompiledAnimation | undefined)[]} A fade per stop; the
 *   first entry is `undefined` (the always-opaque base).
 */
const compileCrossFade: (
  scope: AnimationScope,
  ats: readonly number[],
  prefix: string,
) => readonly (CompiledAnimation | undefined)[] = (
  scope: AnimationScope,
  ats: readonly number[],
  prefix: string,
): readonly (CompiledAnimation | undefined)[] => {
  const iterations: string =
    scope.animation.repeat === Number.POSITIVE_INFINITY
      ? Css.infinite
      : String(scope.animation.repeat + 1);

  const fadeAt: (at: number, index: number) => CompiledAnimation = (
    at: number,
    index: number,
  ): CompiledAnimation => {
    const name: string = `${prefix}c${String(index)}`;
    const prevAt: number = ats[index - 1] ?? 0;
    const head: string =
      prevAt > 0
        ? `0%{${Css.opacity}:0}${num(prevAt * Format.percent)}%{${Css.opacity}:0}`
        : `0%{${Css.opacity}:0}`;
    const tail: string =
      at < 1
        ? `${num(at * Format.percent)}%{${Css.opacity}:1}100%{${Css.opacity}:1}`
        : `${num(at * Format.percent)}%{${Css.opacity}:1}`;
    const style: CSSProperties = {
      animation: [
        name,
        time(scope.animation.durationMs),
        Easing.linear,
        time(scope.beginMs),
        iterations,
        Css.both,
      ].join(" "),
    };
    return { keyframes: `@keyframes ${name}{${head}${tail}}`, style };
  };

  return ats.map((at: number, index: number): CompiledAnimation | undefined =>
    index === 0 ? undefined : fadeAt(at, index),
  );
};

/**
 * Walks a rasterized layer tree, compiling each animated scope to CSS and
 * attaching it. Names are `<prefix><n>` in pre-order, so every `@keyframes` in
 * the document is unique.
 *
 * @param {LayerTree} tree - The rasterized layer tree.
 * @param {string} prefix - A per-theme prefix that keeps names unique.
 *
 * @returns {LayerTree} The same tree with a compiled animation on every scope.
 */
const compileAnimations: (tree: LayerTree, prefix: string) => LayerTree = (
  tree: LayerTree,
  prefix: string,
): LayerTree => {
  let counter = 0;

  const walk: (node: LayerTree) => LayerTree = (node: LayerTree): LayerTree => {
    const scope: ScopeNode | undefined = node.scope;
    const name: string = `${prefix}${String(counter)}`;
    const animation: CompiledAnimation | undefined = is.undefined(scope)
      ? undefined
      : compileScope(scope.scope, scope.box, name);
    let crossFade: readonly CrossFadeLayer[] | undefined = node.crossFade;
    if (!(is.undefined(node.crossFade) || is.undefined(scope))) {
      const fades: readonly (CompiledAnimation | undefined)[] =
        compileCrossFade(
          scope.scope,
          node.crossFade.map((stop: CrossFadeLayer): number => stop.at),
          `${name}-`,
        );
      crossFade = node.crossFade.map(
        (stop: CrossFadeLayer, index: number): CrossFadeLayer => {
          const fade: CompiledAnimation | undefined = fades[index];
          return is.undefined(fade) ? stop : { ...stop, animation: fade };
        },
      );
    }
    if (!is.undefined(scope)) counter += 1;
    const children: readonly LayerTree[] = node.children.map(walk);
    return {
      ...node,
      children,
      ...(is.undefined(animation) ? {} : { animation }),
      ...(is.undefined(crossFade) ? {} : { crossFade }),
    };
  };

  return walk(tree);
};

/**
 * Gathers every scope's `@keyframes` rule in a tree into one CSS string.
 *
 * @param {LayerTree} tree - The compiled layer tree.
 *
 * @returns {string} The concatenated `@keyframes` rules.
 */
const collectKeyframes: (tree: LayerTree) => string = (
  tree: LayerTree,
): string =>
  (tree.animation?.keyframes ?? "") +
  (tree.crossFade ?? [])
    .map((stop: CrossFadeLayer): string => stop.animation?.keyframes ?? "")
    .join("") +
  tree.children.map(collectKeyframes).join("");

export type { ColorStop };
export { collectKeyframes, colorStops, compileAnimations, compileScope };
