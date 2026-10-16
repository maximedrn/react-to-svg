import is from "@sindresorhus/is";
import type { Element } from "@xmldom/xmldom";
import { compileAnimations } from "@/animate/animate.css.ts";
import {
  ComposePrefix,
  CompositionKind,
  DarkMedia,
} from "@/compose/compose.constants.ts";
import type {
  Composition,
  MergedComposition,
  SplitComposition,
} from "@/compose/compose.types.ts";
import { contentOf } from "@/flatten/flatten.dom.ts";
import { flattenLayer } from "@/flatten/flatten.layer.ts";
import { alignLayers, applyEdits } from "@/flatten/flatten.themes.ts";
import type { ThemedColor, ThemeEdit } from "@/flatten/flatten.types.ts";
import type {
  CompiledAnimation,
  CrossFadeLayer,
  Layer,
  LayerTree,
} from "@/layer/layer.types.ts";
import { ThemeVariant } from "@/render.types.ts";

/**
 * The motion a layer tree plays, stripped of its rasters.
 */
interface Motion {
  readonly animation?: CompiledAnimation | undefined;
  readonly children: readonly Motion[];
  readonly crossFade: readonly (readonly [
    number,
    CompiledAnimation | undefined,
  ])[];
}

/**
 * Lists the layers of a tree in pre-order: each node's own layer, then its
 * cross-fade layers, then its children's.
 *
 * @param {LayerTree} tree - The layer tree.
 *
 * @returns {readonly Layer[]} Its layers.
 */
const layersOf: (tree: LayerTree) => readonly Layer[] = (
  tree: LayerTree,
): readonly Layer[] => [
  tree.layer,
  ...(tree.crossFade ?? []).map((stop: CrossFadeLayer): Layer => stop.layer),
  ...tree.children.flatMap(layersOf),
];

/**
 * Extracts the motion of a tree, so two trees can be compared without their
 * rasters.
 *
 * @param {LayerTree} tree - The compiled layer tree.
 *
 * @returns {Motion} Its structure and animations.
 */
const motionOf: (tree: LayerTree) => Motion = (tree: LayerTree): Motion => ({
  animation: tree.animation,
  children: tree.children.map(motionOf),
  crossFade: (tree.crossFade ?? []).map(
    (
      stop: CrossFadeLayer,
    ): readonly [number, CompiledAnimation | undefined] => [
      stop.at,
      stop.animation,
    ],
  ),
});

/**
 * Builds the id prefix of the n-th layer of a theme.
 *
 * @param {string} scope - What the layer belongs to.
 * @param {number} index - The layer's pre-order index.
 *
 * @returns {string} A document-unique id prefix.
 */
const layerPrefix: (scope: string, index: number) => string = (
  scope: string,
  index: number,
): string => `${scope}${index.toString(36)}${ComposePrefix.separator}`;

/**
 * Draws both themes once when they play the same motion over the same geometry,
 * and only disagree on colors and opacities.
 *
 * @param {Readonly<Record<ThemeVariant, LayerTree>>} rasterized - The
 *   rasterized layer tree of each theme.
 *
 * @returns {MergedComposition | undefined} The merged composition, or
 *   `undefined` when the themes differ by more than colors.
 */
const mergeThemes: (
  rasterized: Readonly<Record<ThemeVariant, LayerTree>>,
) => MergedComposition | undefined = (
  rasterized: Readonly<Record<ThemeVariant, LayerTree>>,
): MergedComposition | undefined => {
  const light: LayerTree = compileAnimations(
    rasterized.light,
    ComposePrefix.keyframes,
  );
  const dark: LayerTree = compileAnimations(
    rasterized.dark,
    ComposePrefix.keyframes,
  );
  if (JSON.stringify(motionOf(light)) !== JSON.stringify(motionOf(dark))) {
    return;
  }
  const darks: readonly Layer[] = layersOf(dark);
  const edits: ThemeEdit[] = [];
  const roots: [Layer, Element][] = [];
  for (const [index, layer] of layersOf(light).entries()) {
    const prefix: string = layerPrefix(ComposePrefix.layer, index);
    const other: Layer | undefined = darks[index];
    const root: Element = flattenLayer(layer.svg, prefix);
    if (
      is.undefined(other) ||
      !alignLayers(root, flattenLayer(other.svg, prefix), edits)
    ) {
      return;
    }
    roots.push([layer, root]);
  }
  const colors: readonly ThemedColor[] = applyEdits(edits);
  return {
    colors,
    kind: CompositionKind.merged,
    markup: new Map(
      roots.map(([layer, root]: [Layer, Element]): [Layer, string] => [
        layer,
        contentOf(root),
      ]),
    ),
    tree: light,
  };
};

/**
 * Draws each theme on its own, every layer flattened under ids unique to its
 * theme.
 *
 * @param {Readonly<Record<ThemeVariant, LayerTree>>} rasterized - The
 *   rasterized layer tree of each theme.
 *
 * @returns {SplitComposition} The split composition.
 */
const splitThemes: (
  rasterized: Readonly<Record<ThemeVariant, LayerTree>>,
) => SplitComposition = (
  rasterized: Readonly<Record<ThemeVariant, LayerTree>>,
): SplitComposition => {
  const compile: (variant: ThemeVariant) => LayerTree = (
    variant: ThemeVariant,
  ): LayerTree =>
    compileAnimations(
      rasterized[variant],
      `${ComposePrefix.keyframes}${variant}${ComposePrefix.separator}`,
    );
  const trees: Readonly<Record<ThemeVariant, LayerTree>> = {
    dark: compile(ThemeVariant.dark),
    light: compile(ThemeVariant.light),
  };
  return {
    kind: CompositionKind.split,
    markup: new Map(
      Object.values(ThemeVariant).flatMap(
        (variant: ThemeVariant): [Layer, string][] =>
          layersOf(trees[variant]).map(
            (layer: Layer, index: number): [Layer, string] => [
              layer,
              contentOf(flattenLayer(layer.svg, layerPrefix(variant, index))),
            ],
          ),
      ),
    ),
    trees,
  };
};

/**
 * Composes the two themes: merged into one drawing when they only differ by
 * colors, which halves the document, or split into two toggled groups.
 *
 * @param {Readonly<Record<ThemeVariant, LayerTree>>} rasterized - The
 *   rasterized, not yet compiled, layer tree of each theme.
 *
 * @returns {Composition} How the document lays out the themes.
 */
const composeThemes: (
  rasterized: Readonly<Record<ThemeVariant, LayerTree>>,
) => Composition = (
  rasterized: Readonly<Record<ThemeVariant, LayerTree>>,
): Composition => mergeThemes(rasterized) ?? splitThemes(rasterized);

/**
 * Writes the rules of the themed colors: the light value by default, the dark
 * one under `prefers-color-scheme: dark`.
 *
 * @param {readonly ThemedColor[]} colors - The themed colors.
 *
 * @returns {string} The stylesheet, empty when no color is themed.
 */
const themedStylesheet: (colors: readonly ThemedColor[]) => string = (
  colors: readonly ThemedColor[],
): string => {
  const rules: (pick: (color: ThemedColor) => string) => string = (
    pick: (color: ThemedColor) => string,
  ): string =>
    colors
      .map(
        (color: ThemedColor): string =>
          `.${color.className}{${color.property}:${pick(color)}}`,
      )
      .join("");
  return colors.length === 0
    ? ""
    : `${rules((color: ThemedColor): string => color.light)}${DarkMedia}{${rules(
        (color: ThemedColor): string => color.dark,
      )}}`;
};

export { composeThemes, layersOf, themedStylesheet };
