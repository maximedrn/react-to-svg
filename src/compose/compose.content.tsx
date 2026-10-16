import type { FC, ReactNode } from "react";
import type { LayerContentProps } from "@/compose/compose.types.ts";

/**
 * Inlines a flattened layer.
 *
 * The layer is drawn straight into the document rather than embedded as an
 * `<image>`: the browser parses a single document, and an optimizer sees every
 * element. Satori's deterministic ids (`satori_om-id`, `satori_cp-id-0`, …),
 * identical in every render, were renumbered under a prefix unique to the layer
 * while flattening it, so the `url(#…)` references of several layers cannot
 * resolve against one another.
 *
 * @param {LayerContentProps} props - The layer, the flattened markup of every
 *   layer and an optional animation style.
 *
 * @returns {ReactNode} A `<g>` holding the layer's content.
 */
const LayerContent: FC<LayerContentProps> = (
  props: LayerContentProps,
): ReactNode => (
  <g
    // The markup is the layer's own SVG, rendered by Satori and re-serialized
    // by the flattening step.
    dangerouslySetInnerHTML={{ __html: props.markup.get(props.layer) ?? "" }}
    style={props.style}
  />
);

export { LayerContent };
