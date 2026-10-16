import type { Element } from "@xmldom/xmldom";
import { numberIds, parseSvg } from "@/flatten/flatten.dom.ts";
import { inlineImages } from "@/flatten/flatten.inline.ts";
import { removeInvisiblePaint } from "@/flatten/flatten.paint.ts";

/**
 * Parses a rasterized layer and flattens it so it can live inline in the
 * composed document: embedded icons are inlined, invisible paint is removed,
 * and Satori's ids — identical in every render — are renumbered under a prefix
 * unique to the layer.
 *
 * @param {string} svg - The layer's SVG markup, as Satori produced it.
 * @param {string} prefix - A document-unique prefix for the layer's ids.
 *
 * @returns {Element} The flattened layer's root `<svg>` element.
 *
 * @throws {Error} When the layer is not a well-formed SVG document.
 */
const flattenLayer: (svg: string, prefix: string) => Element = (
  svg: string,
  prefix: string,
): Element => {
  const root: Element = parseSvg(svg);
  inlineImages(root);
  removeInvisiblePaint(root);
  numberIds(root, prefix);
  return root;
};

export { flattenLayer };
