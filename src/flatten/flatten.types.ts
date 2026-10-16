import type { Element } from "@xmldom/xmldom";

/**
 * A rectangle in the user space of the element that draws it.
 */
interface SvgBox {
  readonly height: number;
  readonly width: number;
  readonly x: number;
  readonly y: number;
}

/**
 * An SVG document embedded in an `<image>`, parsed and ready to be inlined.
 */
interface EmbeddedSvg {
  readonly box: SvgBox;
  readonly root: Element;
  readonly viewBox: readonly number[];
}

/**
 * A themed attribute on which the light and dark layers disagree.
 */
interface ThemeEdit {
  readonly attribute: string;
  readonly dark: string;
  readonly element: Element;
  readonly light: string;
}

/**
 * One themed color or opacity, applied through a class whose value follows the
 * color scheme.
 */
interface ThemedColor {
  readonly className: string;
  readonly dark: string;
  readonly light: string;
  readonly property: string;
}

export type { EmbeddedSvg, SvgBox, ThemedColor, ThemeEdit };
