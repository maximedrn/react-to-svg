import { describe, expect, it } from "bun:test";
import { Effect } from "effect";
import type { SatoriOptions } from "satori";
import { Animated } from "@/animate/animate.animated.tsx";
import { Stagger } from "@/animate/animate.stagger.tsx";
import { MeasureError } from "@/layer/layer.errors.ts";
import { type Measurement, measureTree } from "@/layer/layer.measure.ts";
import type { IRenderService } from "@/render.interface.ts";
import { makeRenderService } from "@/render.service.ts";
import { ThemeVariant } from "@/render.types.ts";
import { resolveTree } from "@/resolve/resolve.renderer.ts";
import type { ElementNode } from "@/resolve/resolve.types.ts";
import { fade } from "@/test/test.animations.ts";
import { AutoHeight } from "@/test/test.auto-height.tsx";
import { Config, Height, Width } from "@/test/test.constants.ts";
import { Empty } from "@/test/test.empty.tsx";
import { ShadowPanel } from "@/test/test.shadow.tsx";
import { readSvg, type SvgOutput, themeLayers } from "@/test/test.svg.ts";
import {
  AutoConfig,
  Cases,
  ChildStyle,
  Classes,
  DarkConfig,
  ExpectedDocument,
  ExpectedLayout,
  FailureCases,
  Layout,
  LayoutCases,
  LightConfig,
  Palette,
  ReplacementConfig,
  TestErrors,
} from "@/test/test.tailwind.constants.ts";
import { TailwindPanel } from "@/test/test.tailwind.tsx";

const renderer: IRenderService = makeRenderService();

describe(Cases.suite, (): void => {
  it(Cases.automatic, (): Promise<void> =>
    Effect.runPromise(
      Effect.gen(function* () {
        const output: SvgOutput = readSvg(
          yield* renderer.renderSVG(AutoHeight, AutoConfig),
        );
        expect(output.frame).toEqual({
          height: ExpectedLayout.automaticHeight,
          viewBox: [
            ...ExpectedDocument.origin,
            Width,
            ExpectedLayout.automaticHeight,
          ],
          width: Width,
        });
        expect(output.themes.size).toBe(ExpectedDocument.themeCount);
        for (const layers of output.themes.values())
          expect(layers).toHaveLength(ExpectedDocument.baseLayerCount);
      }),
    ),
  );

  it(Cases.explicit, (): Promise<void> =>
    Effect.runPromise(
      Effect.gen(function* () {
        const output: SvgOutput = readSvg(
          yield* renderer.renderSVG(AutoHeight, Config),
        );
        expect(output.frame).toEqual({
          height: Height,
          viewBox: [...ExpectedDocument.origin, Width, Height],
          width: Width,
        });
      }),
    ),
  );

  it(Cases.emptyLayout, (): Promise<void> =>
    Effect.runPromise(
      Effect.gen(function* () {
        const failure = yield* Effect.flip(
          renderer.renderSVG(Empty, AutoConfig),
        );
        expect(failure).toBeInstanceOf(MeasureError);
      }),
    ),
  );

  for (const scenario of LayoutCases) {
    it(scenario.name, (): Promise<void> =>
      Effect.runPromise(
        Effect.gen(function* () {
          const root: ElementNode = yield* Effect.sync((): ElementNode =>
            resolveTree(<div {...scenario.props} />),
          );
          const { boxes }: Measurement = yield* Effect.promise(
            (): Promise<Measurement> => measureTree(root, AutoConfig),
          );
          expect(boxes.get(root)?.height).toBe(scenario.height);
        }),
      ),
    );
  }

  it(Cases.wrappers, (): Promise<void> =>
    Effect.runPromise(
      Effect.gen(function* () {
        const root: ElementNode = yield* Effect.sync((): ElementNode =>
          resolveTree(
            <Stagger
              animation={fade(Layout.delayMs)}
              className={Classes.stagger}
              stepMs={Layout.stepMs}
            >
              <Animated
                animation={fade(Layout.delayMs)}
                className={Classes.animated}
              >
                <div style={ChildStyle} />
              </Animated>
            </Stagger>,
          ),
        );
        const { boxes }: Measurement = yield* Effect.promise(
          (): Promise<Measurement> => measureTree(root, AutoConfig),
        );
        expect(boxes.get(root)?.height).toBe(ExpectedLayout.wrapperHeight);
      }),
    ),
  );

  it(Cases.shadow, (): Promise<void> =>
    Effect.runPromise(
      Effect.gen(function* () {
        const output: SvgOutput = readSvg(
          yield* renderer.renderSVG(ShadowPanel, Config),
        );
        expect(output.themes.size).toBe(ExpectedDocument.themeCount);
        for (const layers of output.themes.values()) {
          expect(layers).toHaveLength(ExpectedDocument.animatedLayerCount);
          expect(layers[0]?.shadowColors.length).toBeGreaterThan(0);
          expect(layers[1]?.shadowColors).toEqual([]);
          expect(layers[1]?.fills).toContain(Palette.content);
        }
      }),
    ),
  );

  it(Cases.shared, (): Promise<void> =>
    Effect.runPromise(
      Effect.gen(function* () {
        const output: SvgOutput = readSvg(
          yield* renderer.renderSVG(TailwindPanel, {
            ...AutoConfig,
            tailwindConfig: LightConfig,
          }),
        );
        expect(output.frame.height).toBe(ExpectedLayout.sharedHeight);
        expect(output.themes.size).toBe(ExpectedDocument.themeCount);
        for (const layers of output.themes.values()) {
          expect(layers).toHaveLength(ExpectedDocument.baseLayerCount);
          for (const layer of layers)
            expect(layer.fills).toContain(Palette.light);
        }
      }),
    ),
  );

  it(Cases.themes, (): Promise<void> =>
    Effect.runPromise(
      Effect.gen(function* () {
        const output: SvgOutput = readSvg(
          yield* renderer.renderSVG(TailwindPanel, {
            ...AutoConfig,
            tailwindConfig: (
              variant: ThemeVariant,
            ): SatoriOptions["tailwindConfig"] =>
              variant === ThemeVariant.dark ? DarkConfig : LightConfig,
          }),
        );
        expect(themeLayers(output, ThemeVariant.dark)[0]?.fills).toContain(
          Palette.dark,
        );
        expect(themeLayers(output, ThemeVariant.light)[0]?.fills).toContain(
          Palette.light,
        );
      }),
    ),
  );

  it(Cases.replacement, (): Promise<void> =>
    Effect.runPromise(
      Effect.gen(function* () {
        const first: SvgOutput = readSvg(
          yield* renderer.renderSVG(TailwindPanel, {
            ...AutoConfig,
            tailwindConfig: LightConfig,
          }),
        );
        expect(first.frame.height).toBe(ExpectedLayout.sharedHeight);
        const replacement: SvgOutput = readSvg(
          yield* renderer.renderSVG(TailwindPanel, {
            ...AutoConfig,
            tailwindConfig: ReplacementConfig,
          }),
        );
        expect(replacement.frame.height).toBe(ExpectedLayout.replacementHeight);
        expect(replacement.themes.size).toBe(ExpectedDocument.themeCount);
        for (const layers of replacement.themes.values()) {
          expect(layers).toHaveLength(ExpectedDocument.baseLayerCount);
          for (const layer of layers)
            expect(layer.fills).toContain(Palette.replacement);
        }
      }),
    ),
  );

  it(Cases.concurrent, (): Promise<void> =>
    Effect.runPromise(
      Effect.gen(function* () {
        const documents = yield* Effect.all(
          {
            dark: renderer.renderSVG(TailwindPanel, {
              ...AutoConfig,
              tailwindConfig: DarkConfig,
            }),
            light: renderer.renderSVG(TailwindPanel, {
              ...AutoConfig,
              tailwindConfig: LightConfig,
            }),
          },
          { concurrency: ExpectedDocument.themeCount },
        );
        const dark: SvgOutput = readSvg(documents.dark);
        const light: SvgOutput = readSvg(documents.light);
        for (const variant of [ThemeVariant.dark, ThemeVariant.light]) {
          expect(themeLayers(dark, variant)[0]?.fills).toContain(Palette.dark);
          expect(themeLayers(light, variant)[0]?.fills).toContain(
            Palette.light,
          );
        }
      }),
    ),
  );

  for (const scenario of FailureCases) {
    it(scenario.name, (): Promise<void> =>
      Effect.runPromise(
        Effect.gen(function* () {
          const cause: Error = new Error(TestErrors.configuration);
          const tailwindConfig: () => never = (): never => {
            throw cause;
          };
          const failure = yield* Effect.flip(
            renderer.renderSVG(TailwindPanel, {
              ...scenario.options,
              tailwindConfig,
            }),
          );
          expect(failure).toBeInstanceOf(MeasureError);
          expect(failure.cause).toBe(cause);
        }),
      ),
    );
  }
});
