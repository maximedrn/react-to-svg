import is from "@sindresorhus/is";
import type { FC, ReactNode } from "react";
import { LayerImage } from "@/compose/compose.image.tsx";
import type { LayerGroupProps } from "@/compose/compose.types.ts";
import type { CrossFadeLayer, LayerTree } from "@/layer/layer.types.ts";

/**
 * Renders one layer and, inside it, the layers of the scopes nested within — so
 * an ancestor's animation naturally applies to its descendants, exactly as the
 * React nesting implied. An animated scope wraps its content in a `<g>` that
 * carries the compiled CSS animation; the `@keyframes` themselves are hoisted
 * into the document `<style>`.
 *
 * A scope that animates a color channel has no single raster: it stacks one per
 * color state, each carrying its cross-fade opacity animation (the first is the
 * always-opaque base), so the rasters blend from color to color.
 *
 * @param {LayerGroupProps} props - The layer tree to render and the viewport it
 *   fills.
 *
 * @returns {ReactNode} The layer image, its nested layers, and any animation.
 */
const LayerGroup: FC<LayerGroupProps> = (props: LayerGroupProps): ReactNode => {
  const crossFade: readonly CrossFadeLayer[] | undefined = props.tree.crossFade;
  const body: ReactNode =
    is.undefined(crossFade) || crossFade.length === 0 ? (
      <LayerImage
        layer={props.tree.layer}
        viewport={props.viewport}
      />
    ) : (
      crossFade.map((stop: CrossFadeLayer, index: number): ReactNode => (
        <LayerImage
          key={`fade-${String(index)}`}
          layer={stop.layer}
          style={stop.animation?.style}
          viewport={props.viewport}
        />
      ))
    );

  const content: ReactNode = (
    <>
      {body}
      {props.tree.children.map((child: LayerTree, index: number): ReactNode => (
        <LayerGroup
          key={`layer-${String(index)}`}
          tree={child}
          viewport={props.viewport}
        />
      ))}
    </>
  );

  if (is.undefined(props.tree.animation)) return content;

  return <g style={props.tree.animation.style}>{content}</g>;
};

export { LayerGroup };
