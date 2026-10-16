import type { FC, ReactNode } from "react";
import { collectKeyframes } from "@/animate/animate.css.ts";
import { CompositionKind, Document } from "@/compose/compose.constants.ts";
import { LayerGroup } from "@/compose/compose.group.tsx";
import { themedStylesheet } from "@/compose/compose.themes.ts";
import type {
  Composition,
  DocumentProps,
  Viewport,
} from "@/compose/compose.types.ts";
import { ThemeVariant } from "@/render.types.ts";

/**
 * Writes the document stylesheet: every scope's `@keyframes` rule, then either
 * the themed colors of a merged composition, or the theme stylesheet that
 * toggles the groups of a split one.
 *
 * @param {Composition} composition - How the themes are laid out.
 * @param {string} theme - The stylesheet toggling the theme groups.
 *
 * @returns {string} The content of the document `<style>`.
 */
const stylesheetOf: (composition: Composition, theme: string) => string = (
  composition: Composition,
  theme: string,
): string =>
  composition.kind === CompositionKind.merged
    ? `${collectKeyframes(composition.tree)}${themedStylesheet(composition.colors)}`
    : `${Object.values(ThemeVariant)
        .map((variant: ThemeVariant): string =>
          collectKeyframes(composition.trees[variant]),
        )
        .join("")}${theme}`;

/**
 * Assembles the composed layer trees into one self-contained SVG document.
 *
 * When the themes only differ by colors, they are drawn once, and the colors
 * follow `prefers-color-scheme` through classes. Otherwise both themes are
 * emitted under `<g class="light">` and `<g class="dark">`, and
 * `render.theme.css` switches between them. Every scope's `@keyframes` rule is
 * hoisted into the single `<style>`.
 *
 * @param {DocumentProps} props - The composition, the theme stylesheet and the
 *   viewport.
 *
 * @returns {ReactNode} The complete SVG element tree.
 */
const SvgDocument: FC<DocumentProps> = (props: DocumentProps): ReactNode => {
  const { composition } = props;
  const viewport: Viewport = props.viewport;

  return (
    <svg
      height={viewport.height}
      viewBox={`0 0 ${String(viewport.width)} ${String(viewport.height)}`}
      width={viewport.width}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{Document.title}</title>
      <style>{stylesheetOf(composition, props.theme)}</style>
      {composition.kind === CompositionKind.merged ? (
        <LayerGroup
          markup={composition.markup}
          tree={composition.tree}
        />
      ) : (
        Object.values(ThemeVariant).map((variant: ThemeVariant): ReactNode => (
          <g
            className={variant}
            key={variant}
          >
            <LayerGroup
              markup={composition.markup}
              tree={composition.trees[variant]}
            />
          </g>
        ))
      )}
    </svg>
  );
};

export { SvgDocument };
