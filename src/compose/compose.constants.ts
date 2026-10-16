/**
 * Fixed text the composed SVG document carries.
 */
const Document = {
  title: "react-to-svg",
} as const;

/**
 * How the two themes are laid out in the document.
 */
const CompositionKind = {
  merged: "merged",
  split: "split",
} as const;

/**
 * Prefixes that keep the `@keyframes` names and the layer ids unique. A merged
 * document shares one set of names; a split one gets a set per theme.
 */
const ComposePrefix = {
  keyframes: "a-",
  layer: "l",
  separator: "-",
} as const;

/**
 * The media query under which the dark theme applies.
 */
const DarkMedia = "@media (prefers-color-scheme: dark)";

export { ComposePrefix, CompositionKind, DarkMedia, Document };
