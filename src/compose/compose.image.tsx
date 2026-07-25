import type { FC, ReactNode } from "react";
import type { LayerImageProps } from "@/compose/compose.types.ts";
import { SvgMediaType } from "@/render.constants.ts";

/**
 * Embeds a rasterized layer.
 *
 * Each layer becomes its own SVG _document_, which is what keeps Satori's
 * deterministic ids (`satori_om-id`, `satori_cp-id-0`, …) from colliding: they
 * are identical in every render, so inlining several of them into one document
 * would make `url(#…)` references resolve against the wrong layer.
 *
 * `Buffer` is Bun's global, so the layer is base64-encoded without importing a
 * Node module.
 *
 * @param {LayerImageProps} props - The layer's opaque bytes and the viewport it
 *   fills.
 *
 * @returns {ReactNode} An `<image>` embedding the layer as a data URI.
 */
const LayerImage: FC<LayerImageProps> = (props: LayerImageProps): ReactNode => {
  const encoded: string = Buffer.from(props.layer.svg).toString("base64");

  return (
    <image
      height={props.viewport.height}
      href={`data:${SvgMediaType};base64,${encoded}`}
      style={props.style}
      width={props.viewport.width}
      x={0}
      y={0}
    />
  );
};

export { LayerImage };
