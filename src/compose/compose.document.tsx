import type { FC, ReactNode } from "react";
import { collectKeyframes } from "@/animate/animate.css.ts";
import { Document } from "@/compose/compose.constants.ts";
import { LayerGroup } from "@/compose/compose.group.tsx";
import type { DocumentProps } from "@/compose/compose.types.ts";
import { ThemeVariant } from "@/render.types.ts";

/**
 * Assembles the per-theme layer trees into one self-contained SVG document.
 *
 * Both themes are emitted into the same document under `<g class="light">` and
 * `<g class="dark">`; `render.theme.css` switches between them with
 * `prefers-color-scheme`. Every scope's `@keyframes` rule is hoisted, ahead of
 * the theme stylesheet, into the single `<style>`.
 *
 * @param {DocumentProps} props - The per-theme layers, the stylesheet and the
 *   viewport.
 *
 * @returns {ReactNode} The complete SVG element tree.
 */
const SvgDocument: FC<DocumentProps> = (props: DocumentProps): ReactNode => {
  const keyframes: string = Object.values(ThemeVariant)
    .map((variant: ThemeVariant): string =>
      collectKeyframes(props.layers[variant]),
    )
    .join("");

  return (
    <svg
      height={props.viewport.height}
      viewBox={`0 0 ${String(props.viewport.width)} ${String(props.viewport.height)}`}
      width={props.viewport.width}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{Document.title}</title>
      <style>{`${keyframes}${props.theme}`}</style>
      {Object.values(ThemeVariant).map((variant: ThemeVariant): ReactNode => (
        <g
          className={variant}
          key={variant}
        >
          <LayerGroup
            tree={props.layers[variant]}
            viewport={props.viewport}
          />
        </g>
      ))}
    </svg>
  );
};

export { SvgDocument };
