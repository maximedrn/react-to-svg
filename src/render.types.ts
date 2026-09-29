import type { FC } from "react";
import type { SatoriOptions } from "satori";

/**
 * The two color schemes a document carries.
 */
const ThemeVariant = {
  dark: "dark",
  light: "light",
} as const;

type ThemeVariant = (typeof ThemeVariant)[keyof typeof ThemeVariant];

/**
 * Font styles Satori can shape.
 */
const FontStyle = {
  italic: "italic",
  normal: "normal",
} as const;

type FontStyle = (typeof FontStyle)[keyof typeof FontStyle];

/**
 * The nine standard font weights.
 */
const FontWeight = {
  _100: 100,
  _200: 200,
  _300: 300,
  _400: 400,
  _500: 500,
  _600: 600,
  _700: 700,
  _800: 800,
  _900: 900,
} as const;

type FontWeight = (typeof FontWeight)[keyof typeof FontWeight];

/**
 * A single font face handed to Satori.
 */
interface FontConfig {
  readonly data: ArrayBuffer;
  readonly name: string;
  readonly style?: FontStyle;
  readonly weight?: FontWeight;
}

/**
 * Everything a render needs: the fonts to shape text with, and the viewport.
 */
interface RenderOptions {
  readonly fonts: readonly FontConfig[];
  /**
   * Omit to measure the light theme's intrinsic height, rounded up.
   */
  readonly height?: number;
  readonly tailwindConfig?:
    | SatoriOptions["tailwindConfig"]
    | ((theme: ThemeVariant) => SatoriOptions["tailwindConfig"]);
  readonly width: number;
}

/**
 * A component the renderer can drive: it receives the theme to render for.
 */
type RenderableComponent = FC<{ readonly theme: ThemeVariant }>;

export type { FontConfig, RenderableComponent, RenderOptions };
export { FontStyle, FontWeight, ThemeVariant };
