import { describe, expect, it } from "bun:test";
import { Effect } from "effect";
import { createElement } from "react";
import type { SatoriOptions } from "satori";
import { Animated } from "@/animate/animate.animated.tsx";
import { Stagger } from "@/animate/animate.stagger.tsx";
import { type Measurement, measureTree } from "@/layer/layer.measure.ts";
import { projectScope } from "@/layer/layer.project.ts";
import { renderDocument } from "@/render.pipeline.ts";
import { type RenderableComponent, ThemeVariant } from "@/render.types.ts";
import { resolveTree } from "@/resolve/resolve.renderer.ts";
import type { ElementNode } from "@/resolve/resolve.types.ts";
import { fade } from "@/test/test.animations.ts";
import { AutoHeight } from "@/test/test.auto-height.tsx";
import { Config, Theme } from "@/test/test.constants.ts";
import {
  DarkConfig,
  Layout,
  LightConfig,
  ReplacementConfig,
  TestErrors,
} from "@/test/test.tailwind.constants.ts";
import { TailwindPanel } from "@/test/test.tailwind.tsx";

const layersOf: (markup: string) => readonly string[] = (
  markup: string,
): readonly string[] =>
  [...markup.matchAll(/href="data:image\/svg\+xml;base64,([^"]+)"/g)].map(
    (match: RegExpMatchArray): string =>
      Buffer.from(match[1] ?? "", "base64").toString(),
  );

describe("Render options.", (): void => {
  it("Uses the light theme's intrinsic height for the shared viewport.", async (): Promise<void> => {
    const markup: string = await Effect.runPromise(
      renderDocument(AutoHeight, { fonts: [], width: 200 }, Theme),
    );
    expect(markup).toContain('viewBox="0 0 200 41"');
    expect(layersOf(markup)).toHaveLength(2);
    for (const layer of layersOf(markup))
      expect(layer).toContain('height="41"');
  });

  it("Keeps an explicitly supplied viewport height.", async (): Promise<void> => {
    const markup: string = await Effect.runPromise(
      renderDocument(AutoHeight, Config, Theme),
    );
    expect(markup).toContain('viewBox="0 0 200 120"');
  });

  it("Reports empty automatic layouts through the typed error channel.", async (): Promise<void> => {
    const Empty: RenderableComponent = () =>
      createElement("div", { style: { display: "flex" } });
    const outcome = await Effect.runPromise(
      Effect.either(renderDocument(Empty, { fonts: [], width: 200 }, Theme)),
    );
    expect(outcome._tag === "Left" ? outcome.left._tag : undefined).toBe(
      "MeasureError",
    );
  });

  it("Uses className ahead of the legacy tw prop when measuring host elements.", async (): Promise<void> => {
    const root: ElementNode = resolveTree(
      createElement("div", { className: "flex h-[48px]", tw: "flex h-[16px]" }),
    );
    const { boxes }: Measurement = await measureTree(root, {
      fonts: [],
      width: 200,
    });
    expect(boxes.get(root)?.height).toBe(Layout.classNameHeight);
    const legacy: ElementNode = resolveTree(
      createElement("div", { tw: "flex h-[16px]" }),
    );
    expect(
      (await measureTree(legacy, { fonts: [], width: 200 })).boxes.get(legacy)
        ?.height,
    ).toBe(Layout.legacyHeight);
  });

  it("Lays out className on Animated and Stagger wrappers.", async (): Promise<void> => {
    const root: ElementNode = resolveTree(
      <Stagger
        animation={fade(0)}
        className="p-[8px]"
        stepMs={100}
      >
        <Animated
          animation={fade(0)}
          className="p-[4px]"
        >
          <div style={{ display: "flex", height: 8, width: 8 }} />
        </Animated>
      </Stagger>,
    );
    const { boxes }: Measurement = await measureTree(root, {
      fonts: [],
      width: 200,
    });
    expect(boxes.get(root)?.height).toBe(Layout.wrapperHeight);
  });

  it("Resets className shadows on the ancestors of animated layers.", async (): Promise<void> => {
    const root: ElementNode = resolveTree(
      <div
        className="flex shadow-lg"
        style={{ display: "flex" }}
      >
        <Animated animation={fade(0)}>
          <div style={{ display: "flex", height: 8, width: 8 }} />
        </Animated>
      </div>,
    );
    const { boxes, scopes }: Measurement = await measureTree(root, Config);
    expect(scopes).toHaveLength(1);
    for (const scope of scopes)
      expect(projectScope(root, scope, boxes).props.style).toMatchObject({
        boxShadow: "0 0 0 0 transparent",
      });
  });

  it("Uses a shared Tailwind config for measurement and rasterization.", async (): Promise<void> => {
    const markup: string = await Effect.runPromise(
      renderDocument(
        TailwindPanel,
        { fonts: [], tailwindConfig: LightConfig, width: 200 },
        Theme,
      ),
    );
    expect(markup).toContain('viewBox="0 0 200 40"');
    expect(layersOf(markup)).toHaveLength(2);
    for (const layer of layersOf(markup))
      expect(layer).toContain('fill="#ff0000"');
  });

  it("Keeps theme configurations and subsequent replacements isolated.", async (): Promise<void> => {
    const markup: string = await Effect.runPromise(
      renderDocument(
        TailwindPanel,
        {
          fonts: [],
          tailwindConfig: (
            variant: ThemeVariant,
          ): SatoriOptions["tailwindConfig"] =>
            variant === ThemeVariant.dark ? DarkConfig : LightConfig,
          width: 200,
        },
        Theme,
      ),
    );
    const layers: readonly string[] = layersOf(markup);
    expect(layers).toHaveLength(2);
    expect(layers[0]).toContain('fill="#0000ff"');
    expect(layers[1]).toContain('fill="#ff0000"');
    const replacement: string = await Effect.runPromise(
      renderDocument(
        TailwindPanel,
        { fonts: [], tailwindConfig: ReplacementConfig, width: 200 },
        Theme,
      ),
    );
    expect(replacement).toContain('viewBox="0 0 200 48"');
    for (const layer of layersOf(replacement))
      expect(layer).toContain('fill="#00ff00"');
  });

  it("Reports a failing Tailwind config factory through the typed error channel.", async (): Promise<void> => {
    const tailwindConfig = (): never => {
      throw new Error(TestErrors.configuration);
    };
    const outcome = await Effect.runPromise(
      Effect.either(
        renderDocument(TailwindPanel, { ...Config, tailwindConfig }, Theme),
      ),
    );
    expect(outcome._tag === "Left" ? outcome.left._tag : undefined).toBe(
      "MeasureError",
    );
  });
});
