import is from "@sindresorhus/is";
import { Effect } from "effect";
import { createElement } from "react";
import { MeasureError, MeasureMessages } from "@/layer/layer.errors.ts";
import { type Measurement, measureTree } from "@/layer/layer.measure.ts";
import type { SatoriConfig } from "@/layer/layer.raster.ts";
import type { Box } from "@/layer/layer.types.ts";
import {
  type RenderableComponent,
  type RenderOptions,
  ThemeVariant,
} from "@/render.types.ts";
import { ResolveError, ResolveMessages } from "@/resolve/resolve.errors.ts";
import { resolveTree } from "@/resolve/resolve.renderer.ts";
import type { ElementNode } from "@/resolve/resolve.types.ts";

/**
 * Resolves a theme's Tailwind configuration through the typed error channel.
 */
const resolveConfig: (
  options: RenderOptions,
  theme: ThemeVariant,
) => Effect.Effect<SatoriConfig, MeasureError> = (
  options: RenderOptions,
  theme: ThemeVariant,
): Effect.Effect<SatoriConfig, MeasureError> =>
  Effect.try({
    catch: (cause: unknown): MeasureError =>
      new MeasureError({ cause, message: MeasureMessages.failed }),
    try: (): SatoriConfig => ({
      fonts: options.fonts,
      ...(is.undefined(options.height) ? {} : { height: options.height }),
      tailwindConfig: is.function(options.tailwindConfig)
        ? options.tailwindConfig(theme)
        : options.tailwindConfig,
      width: options.width,
    }),
  });

/**
 * Measures the light theme's natural height for the shared SVG viewport.
 */
const measureHeight: (
  Component: RenderableComponent,
  options: RenderOptions,
) => Effect.Effect<number, MeasureError | ResolveError> = (
  Component: RenderableComponent,
  options: RenderOptions,
): Effect.Effect<number, MeasureError | ResolveError> =>
  Effect.gen(function* () {
    const root: ElementNode = yield* Effect.try({
      catch: (cause: unknown): ResolveError =>
        new ResolveError({ cause, message: ResolveMessages.failed }),
      try: (): ElementNode =>
        resolveTree(createElement(Component, { theme: ThemeVariant.light })),
    });
    const config: SatoriConfig = yield* resolveConfig(
      options,
      ThemeVariant.light,
    );
    const measurement: Measurement = yield* Effect.tryPromise({
      catch: (cause: unknown): MeasureError =>
        new MeasureError({ cause, message: MeasureMessages.failed }),
      try: (): Promise<Measurement> => measureTree(root, config),
    });
    const box: Box | undefined = measurement.boxes.get(root);
    if (is.undefined(box) || !Number.isFinite(box.height) || box.height <= 0) {
      return yield* Effect.fail(
        new MeasureError({ cause: undefined, message: MeasureMessages.failed }),
      );
    }
    return Math.ceil(box.height);
  });

export { measureHeight, resolveConfig };
