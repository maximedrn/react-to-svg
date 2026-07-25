import is from "@sindresorhus/is";
import { Effect } from "effect";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  type ColorStop,
  colorStops,
  compileAnimations,
} from "@/animate/animate.css.ts";
import { SvgDocument } from "@/compose/compose.document.tsx";
import { ComposeError, ComposeMessages } from "@/compose/compose.errors.ts";
import {
  MeasureError,
  MeasureMessages,
  RasterizeError,
  RasterizeMessages,
} from "@/layer/layer.errors.ts";
import { type Measurement, measureTree } from "@/layer/layer.measure.ts";
import { projectBase, projectScope } from "@/layer/layer.project.ts";
import { rasterizeLayer, type SatoriConfig } from "@/layer/layer.raster.ts";
import type {
  BoxMap,
  CrossFadeLayer,
  Layer,
  LayerTree,
  ScopeNode,
} from "@/layer/layer.types.ts";
import {
  type RenderableComponent,
  type RenderOptions,
  ThemeVariant,
} from "@/render.types.ts";
import { ResolveError, ResolveMessages } from "@/resolve/resolve.errors.ts";
import { resolveTree } from "@/resolve/resolve.renderer.ts";
import type { ElementNode } from "@/resolve/resolve.types.ts";

const RasterConcurrency = 8;
const ThemeConcurrency = 2;

/**
 * One color state of a scope before rasterization: the position at which it is
 * fully shown, and the scope re-projected with that color applied.
 */
interface ColorProjection {
  readonly at: number;
  readonly tree: ElementNode;
}

/**
 * A layer before rasterization: still a plain tree, still inspect-able. A scope
 * that animates a color channel also carries one `colors` entry per color
 * state, each rasterized separately and cross-faded (a bitmap cannot be
 * recolored in place).
 */
interface Projection {
  readonly children: readonly Projection[];
  readonly colors?: readonly ColorProjection[];
  readonly scope?: ScopeNode;
  readonly tree: ElementNode;
}

/**
 * Derives the base projection and one projection per scope, nested to mirror
 * the scope hierarchy.
 *
 * @param {ElementNode} root - The resolved tree.
 * @param {BoxMap} boxes - The measured geometry, keyed by element identity.
 * @param {readonly ScopeNode[]} scopes - The top-level scopes of the tree.
 *
 * @returns {Projection} The base projection with its nested scope projections.
 */
const projectAll: (
  root: ElementNode,
  boxes: BoxMap,
  scopes: readonly ScopeNode[],
) => Projection = (
  root: ElementNode,
  boxes: BoxMap,
  scopes: readonly ScopeNode[],
): Projection => {
  const forScope: (scope: ScopeNode) => Projection = (
    scope: ScopeNode,
  ): Projection => {
    const colors: readonly ColorProjection[] = colorStops(scope.scope).map(
      (stop: ColorStop): ColorProjection => ({
        at: stop.at,
        tree: projectScope(root, scope, boxes, stop.colors),
      }),
    );
    return {
      children: scope.children.map(forScope),
      scope,
      tree: projectScope(root, scope, boxes),
      ...(colors.length === 0 ? {} : { colors }),
    };
  };

  return {
    children: scopes.map(forScope),
    tree: projectBase(root, boxes),
  };
};

/**
 * Rasterizes a projection and, concurrently, the projections nested in it.
 *
 * @param {Projection} projection - The projection to rasterize.
 * @param {SatoriConfig} config - Fonts and viewport Satori needs.
 *
 * @returns {Effect.Effect<LayerTree, RasterizeError>} The rasterized layer
 *   tree.
 */
const rasterizeProjection: (
  projection: Projection,
  config: SatoriConfig,
) => Effect.Effect<LayerTree, RasterizeError> = (
  projection: Projection,
  config: SatoriConfig,
): Effect.Effect<LayerTree, RasterizeError> =>
  Effect.gen(function* () {
    const layer: Layer = yield* Effect.tryPromise({
      catch: (cause: unknown): RasterizeError =>
        new RasterizeError({ cause, message: RasterizeMessages.failed }),
      try: (): Promise<Layer> => rasterizeLayer(projection.tree, config),
    });
    const children: readonly LayerTree[] = yield* Effect.forEach(
      projection.children,
      (child: Projection): Effect.Effect<LayerTree, RasterizeError> =>
        rasterizeProjection(child, config),
      { concurrency: RasterConcurrency },
    );
    const crossFade: readonly CrossFadeLayer[] = yield* Effect.forEach(
      projection.colors ?? [],
      (color: ColorProjection): Effect.Effect<CrossFadeLayer, RasterizeError> =>
        Effect.map(
          Effect.tryPromise({
            catch: (cause: unknown): RasterizeError =>
              new RasterizeError({ cause, message: RasterizeMessages.failed }),
            try: (): Promise<Layer> => rasterizeLayer(color.tree, config),
          }),
          (colorLayer: Layer): CrossFadeLayer => ({
            at: color.at,
            layer: colorLayer,
          }),
        ),
      { concurrency: RasterConcurrency },
    );

    return {
      children,
      layer,
      ...(crossFade.length === 0 ? {} : { crossFade }),
      ...(is.undefined(projection.scope) ? {} : { scope: projection.scope }),
    };
  });

/**
 * Builds the layer tree for one theme. Each theme is resolved and measured
 * independently, so a component may legitimately render a different structure
 * per theme without the two getting out of step.
 *
 * @param {RenderableComponent} Component - The component to render.
 * @param {ThemeVariant} theme - The theme variant to render it for.
 * @param {SatoriConfig} config - Fonts and viewport Satori needs.
 *
 * @returns {Effect.Effect<
 *   LayerTree,
 *   MeasureError | RasterizeError | ResolveError
 * >}
 *   The theme's layer tree.
 */
const buildTheme: (
  Component: RenderableComponent,
  theme: ThemeVariant,
  config: SatoriConfig,
) => Effect.Effect<LayerTree, MeasureError | RasterizeError | ResolveError> = (
  Component: RenderableComponent,
  theme: ThemeVariant,
  config: SatoriConfig,
): Effect.Effect<LayerTree, MeasureError | RasterizeError | ResolveError> =>
  Effect.gen(function* () {
    const root: ElementNode = yield* Effect.try({
      catch: (cause: unknown): ResolveError =>
        new ResolveError({ cause, message: ResolveMessages.failed }),
      try: (): ElementNode => resolveTree(createElement(Component, { theme })),
    });
    const measurement: Measurement = yield* Effect.tryPromise({
      catch: (cause: unknown): MeasureError =>
        new MeasureError({ cause, message: MeasureMessages.failed }),
      try: (): Promise<Measurement> => measureTree(root, config),
    });

    const rasterized: LayerTree = yield* rasterizeProjection(
      projectAll(root, measurement.boxes, measurement.scopes),
      config,
    );
    return compileAnimations(rasterized, `a-${theme}-`);
  });

/**
 * Looks up a theme's layer tree, asserting the invariant that every theme was
 * built (both are rendered before this runs).
 *
 * @param {ReadonlyMap<ThemeVariant, LayerTree>} byTheme - The layer trees
 *   produced for each theme.
 * @param {ThemeVariant} variant - The theme to look up.
 *
 * @returns {LayerTree} The theme's layer tree.
 */
const requireTheme: (
  byTheme: ReadonlyMap<ThemeVariant, LayerTree>,
  variant: ThemeVariant,
) => LayerTree = (
  byTheme: ReadonlyMap<ThemeVariant, LayerTree>,
  variant: ThemeVariant,
): LayerTree => {
  const tree: LayerTree | undefined = byTheme.get(variant);
  if (is.undefined(tree)) {
    throw new Error(ComposeMessages.missingTheme(variant));
  }
  return tree;
};

/**
 * Renders `Component` for both themes and composes them into one SVG string.
 *
 * @param {RenderableComponent} Component - The component to render.
 * @param {RenderOptions} options - Fonts and viewport for the render.
 * @param {string} theme - The stylesheet inlined into the document.
 *
 * @returns {Effect.Effect<
 *   string,
 *   ComposeError | MeasureError | RasterizeError | ResolveError
 * >}
 *   The composed SVG markup.
 */
const renderDocument: (
  Component: RenderableComponent,
  options: RenderOptions,
  theme: string,
) => Effect.Effect<
  string,
  ComposeError | MeasureError | RasterizeError | ResolveError
> = (
  Component: RenderableComponent,
  options: RenderOptions,
  theme: string,
): Effect.Effect<
  string,
  ComposeError | MeasureError | RasterizeError | ResolveError
> =>
  Effect.gen(function* () {
    const config: SatoriConfig = {
      fonts: options.fonts,
      height: options.height,
      width: options.width,
    };
    const variants: readonly (readonly [ThemeVariant, LayerTree])[] =
      yield* Effect.forEach(
        Object.values(ThemeVariant),
        (
          variant: ThemeVariant,
        ): Effect.Effect<
          readonly [ThemeVariant, LayerTree],
          MeasureError | RasterizeError | ResolveError
        > =>
          buildTheme(Component, variant, config).pipe(
            Effect.map(
              (tree: LayerTree): readonly [ThemeVariant, LayerTree] => [
                variant,
                tree,
              ],
            ),
          ),
        { concurrency: ThemeConcurrency },
      );

    return yield* Effect.try({
      catch: (cause: unknown): ComposeError =>
        new ComposeError({ cause, message: ComposeMessages.failed }),
      try: (): string => {
        const byTheme: ReadonlyMap<ThemeVariant, LayerTree> = new Map(variants);
        const layers: Readonly<Record<ThemeVariant, LayerTree>> = {
          dark: requireTheme(byTheme, ThemeVariant.dark),
          light: requireTheme(byTheme, ThemeVariant.light),
        };
        return renderToStaticMarkup(
          createElement(SvgDocument, {
            layers,
            theme,
            viewport: { height: options.height, width: options.width },
          }),
        );
      },
    });
  });

export type { Projection };
export { renderDocument };
