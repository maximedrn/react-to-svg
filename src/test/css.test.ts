import { describe, expect, it } from "bun:test";
import { Easing } from "@/animate/animate.constants.ts";
import {
  collectKeyframes,
  colorStops,
  compileAnimations,
  compileScope,
} from "@/animate/animate.css.ts";
import type {
  CompiledAnimation,
  CrossFadeLayer,
  LayerTree,
} from "@/layer/layer.types.ts";
import { colorAnimation, fade, scale, slide } from "@/test/test.animations.ts";
import {
  Channel,
  SampleBox,
  SampleLayer,
  Shape,
  Timing,
} from "@/test/test.constants.ts";
import { asScope, scopeOf } from "@/test/test.scopes.ts";
import { colorsOf } from "@/test/test.tree.ts";

const decl: (fn: string, value: number, unit: string) => string = (
  fn: string,
  value: number,
  unit: string,
): string => `${fn}(${String(value)}${unit})`;

describe("'compileScope'.", (): void => {
  it("Compiles opacity keyframes into a percentage rule.", (): void => {
    const compiled: CompiledAnimation = compileScope(
      scopeOf(Timing.begin, fade(0)),
      SampleBox,
      "a0",
    );

    expect(compiled.keyframes).toContain("@keyframes a0");
    expect(compiled.keyframes).toContain("0%{opacity:0}");
    expect(compiled.keyframes).toContain("100%{opacity:1}");
    expect(compiled.style.animation).toContain("a0 400ms");
    expect(compiled.style.animation).toContain("150ms");
  });

  it("Compiles a translation into a transform keyframe.", (): void => {
    const compiled: CompiledAnimation = compileScope(
      scopeOf(0, slide(Shape.slideDistance)),
      SampleBox,
      "a0",
    );

    expect(compiled.keyframes).toContain(
      `transform:${decl("translateY", Shape.slideDistance, "px")}`,
    );
    expect(compiled.keyframes).toContain(decl("translateY", 0, ""));
  });

  it("Loops a repeating animation indefinitely.", (): void => {
    const compiled: CompiledAnimation = compileScope(
      scopeOf(0, {
        delayMs: 0,
        durationMs: 400,
        easing: Easing.easeInOut,
        keyframes: [
          { at: 0, scale: 1 },
          { at: 0.5, scale: 1.04 },
          { at: 1, scale: 1 },
        ],
        perspective: 800,
        repeat: Number.POSITIVE_INFINITY,
      }),
      SampleBox,
      "a0",
    );

    expect(compiled.style.animation).toContain("infinite");
  });

  it("Pivots transforms about the measured centre of the box.", (): void => {
    const compiled: CompiledAnimation = compileScope(
      scopeOf(0, scale(0, Shape.scaleFrom)),
      SampleBox,
      "a0",
    );

    expect(compiled.style.transformOrigin).toBe("30px 40px");
    expect(compiled.keyframes).toContain("transform:scale(0.9)");
  });

  it("Compiles the filter and 3D channels.", (): void => {
    const compiled: CompiledAnimation = compileScope(
      scopeOf(0, {
        delayMs: 0,
        durationMs: 300,
        easing: Easing.easeOut,
        keyframes: [
          { at: 0, blur: 4, rotateX: 45 },
          { at: 1, blur: 0, rotateX: 0 },
        ],
        perspective: 800,
        repeat: 0,
      }),
      SampleBox,
      "a0",
    );

    expect(compiled.keyframes).toContain(
      `filter:${decl("blur", Channel.blur, "px")}`,
    );
    expect(compiled.keyframes).toContain(
      decl("rotateX", Channel.rotateX, "deg"),
    );
    expect(compiled.keyframes).toContain(
      decl("perspective", Channel.perspective, "px"),
    );
  });

  it("Emits the caller's CSS easing verbatim.", (): void => {
    const compiled: CompiledAnimation = compileScope(
      scopeOf(0, {
        delayMs: 0,
        durationMs: 300,
        easing: "linear(0, 0.25, 1)",
        keyframes: [
          { at: 0, scale: 0 },
          { at: 1, scale: 1 },
        ],
        perspective: 800,
        repeat: 0,
      }),
      SampleBox,
      "a0",
    );

    expect(compiled.style.animation).toContain("linear(0, 0.25, 1)");
  });

  it("Maps brightness and saturation onto filters.", (): void => {
    const compiled: CompiledAnimation = compileScope(
      scopeOf(0, {
        delayMs: 0,
        durationMs: 400,
        easing: Easing.easeInOut,
        keyframes: [
          { at: 0, brightness: 1, saturate: 1 },
          { at: 0.5, brightness: 1.5, saturate: 1.4 },
          { at: 1, brightness: 1, saturate: 1 },
        ],
        perspective: 800,
        repeat: 0,
      }),
      SampleBox,
      "a0",
    );

    expect(compiled.keyframes).toContain(
      decl("brightness", Channel.brightness, ""),
    );
    expect(compiled.keyframes).toContain(
      decl("saturate", Channel.saturate, ""),
    );
  });

  it("Maps rotateY onto a 3D transform with perspective.", (): void => {
    const compiled: CompiledAnimation = compileScope(
      scopeOf(0, {
        delayMs: 0,
        durationMs: 400,
        easing: Easing.easeOut,
        keyframes: [
          { at: 0, opacity: 0, rotateY: -90 },
          { at: 1, opacity: 1, rotateY: 0 },
        ],
        perspective: 800,
        repeat: 0,
      }),
      SampleBox,
      "a0",
    );

    expect(compiled.keyframes).toContain(
      decl("rotateY", Channel.rotateY, "deg"),
    );
    expect(compiled.keyframes).toContain(
      decl("perspective", Channel.perspective, "px"),
    );
  });
});

describe("'colorStops'.", (): void => {
  it("Extracts one stop per color keyframe, carrying values.", (): void => {
    const stops: ReturnType<typeof colorStops> = colorStops(
      scopeOf(0, colorAnimation("#f00", "#00f")),
    );

    expect(stops.map((stop): number => stop.at)).toEqual([0, 1]);
    expect(colorsOf(stops[0]?.colors).backgroundColor).toBe("#f00");
    expect(colorsOf(stops[1]?.colors).backgroundColor).toBe("#00f");
  });

  it("Returns nothing when fewer than two color states.", (): void => {
    expect(colorStops(scopeOf(0, fade(0)))).toEqual([]);
  });
});

describe("'compileAnimations' cross-fade.", (): void => {
  const withCrossFade: () => LayerTree = (): LayerTree => ({
    children: [],
    crossFade: [
      { at: 0, layer: SampleLayer },
      { at: 1, layer: SampleLayer },
    ],
    layer: SampleLayer,
    scope: asScope(0, colorAnimation("#f00", "#00f")),
  });

  it("Leaves the base stop opaque and fades every later stop in.", (): void => {
    const compiled: LayerTree = compileAnimations(withCrossFade(), "a-");
    const fades: readonly CrossFadeLayer[] = compiled.crossFade ?? [];

    expect(fades[0]?.animation).toBeUndefined();
    expect(fades[1]?.animation?.keyframes).toContain("@keyframes a-0-c1");
    expect(fades[1]?.animation?.keyframes).toContain("100%{opacity:1}");
  });

  it("Hoists the cross-fade keyframes into the collected stylesheet.", (): void => {
    const css: string = collectKeyframes(
      compileAnimations(withCrossFade(), "a-"),
    );

    expect(css).toContain("@keyframes a-0-c1");
  });
});
