import type { CSSProperties } from "react";
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
 * Props for the `LayerImage` component.
 */
interface LayerImageProps {
  readonly layer: Layer;
  /**
   * An optional inline style, used to carry a cross-fade opacity animation on a
   * color scope's stacked color rasters. The base stop carries none.
   */
  readonly style?: CSSProperties | undefined;
  readonly viewport: Viewport;
}

/**
 * Props for the `LayerGroup` component.
 */
interface LayerGroupProps {
  readonly tree: LayerTree;
  readonly viewport: Viewport;
}

/**
 * Props for the `SvgDocument` component.
 */
interface DocumentProps {
  readonly layers: Readonly<Record<ThemeVariant, LayerTree>>;
  readonly theme: string;
  readonly viewport: Viewport;
}

export type { DocumentProps, LayerGroupProps, LayerImageProps, Viewport };
