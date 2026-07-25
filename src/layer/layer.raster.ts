import satori from "satori";
import { toSatoriElement } from "@/layer/layer.element.ts";
import type { Layer } from "@/layer/layer.types.ts";
import type { FontConfig } from "@/render.types.ts";
import type { ElementNode } from "@/resolve/resolve.types.ts";

/**
 * Fonts and viewport Satori needs to lay out and rasterize a tree.
 */
interface SatoriConfig {
  readonly fonts: readonly FontConfig[];
  readonly height: number;
  readonly width: number;
}

/**
 * Rasterizes a projected tree.
 *
 * The result is deliberately opaque: it is stored, embedded and discarded, but
 * never read, parsed or edited. That is the single place where the pipeline
 * touches Satori's string output, and it is a boundary, not a representation.
 *
 * @param {ElementNode} tree - The projected tree to rasterize.
 * @param {SatoriConfig} config - Fonts and viewport Satori needs.
 *
 * @returns {Promise<Layer>} The opaque SVG bytes of the layer.
 */
const rasterizeLayer: (
  tree: ElementNode,
  config: SatoriConfig,
) => Promise<Layer> = async (
  tree: ElementNode,
  config: SatoriConfig,
): Promise<Layer> => {
  const svg: string = await satori(toSatoriElement(tree), {
    fonts: [...config.fonts],
    height: config.height,
    width: config.width,
  });
  return { svg };
};

export type { SatoriConfig };
export { rasterizeLayer };
