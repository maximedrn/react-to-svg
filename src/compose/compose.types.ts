import type { CSSProperties } from "react";
import type { CompositionKind } from "@/compose/compose.constants.ts";
import type { ThemedColor } from "@/flatten/flatten.types.ts";
import type { Layer, LayerTree } from "@/layer/layer.types.ts";
import type { ThemeVariant } from "@/render.types.ts";

/**
 * The pixel size of the composed document and every layer inside it.
 */
interface Viewport {
  readonly height: number;
  readonly width: number;
}

/**
 * The flattened markup of every layer, keyed by layer identity — no indices, no
 * ids, no string matching.
 */
type LayerMarkup = ReadonlyMap<Layer, string>;

/**
 * Both themes drawn once: their geometry is identical, and the colors they
 * disagree on are carried by classes whose value follows the color scheme.
 */
interface MergedComposition {
  readonly colors: readonly ThemedColor[];
  readonly kind: typeof CompositionKind.merged;
  readonly markup: LayerMarkup;
  readonly tree: LayerTree;
}

/**
 * Each theme drawn on its own, under a group the theme stylesheet toggles. Used
 * when the themes differ by more than colors.
 */
interface SplitComposition {
  readonly kind: typeof CompositionKind.split;
  readonly markup: LayerMarkup;
  readonly trees: Readonly<Record<ThemeVariant, LayerTree>>;
}

type Composition = MergedComposition | SplitComposition;

/**
 * Props for the `LayerContent` component.
 */
interface LayerContentProps {
  readonly layer: Layer;
  readonly markup: LayerMarkup;
  /**
   * An optional inline style, used to carry a cross-fade opacity animation on a
   * color scope's stacked color layers. The base stop carries none.
   */
  readonly style?: CSSProperties | undefined;
}

/**
 * Props for the `LayerGroup` component.
 */
interface LayerGroupProps {
  readonly markup: LayerMarkup;
  readonly tree: LayerTree;
}

/**
 * Props for the `SvgDocument` component.
 */
interface DocumentProps {
  readonly composition: Composition;
  readonly theme: string;
  readonly viewport: Viewport;
}

export type {
  Composition,
  DocumentProps,
  LayerContentProps,
  LayerGroupProps,
  LayerMarkup,
  MergedComposition,
  SplitComposition,
  Viewport,
};
