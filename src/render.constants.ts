/**
 * Prop key used to attach a scope token to the elements handed to Satori.
 *
 * The value is an opaque object whose _reference_ is the identity: Satori
 * forwards props verbatim to `onNodeDetected`, so the measured box can be
 * paired with its source node without indices, ids or any string matching.
 */
const NodeTokenProp = "data-render-node";

/**
 * Media type used when a rasterized layer is embedded as an `<image>`.
 */
const SvgMediaType = "image/svg+xml";

/**
 * Layout properties that Satori resolves for a text run.
 */
const TextNodeType = "#text";

/**
 * Element Satori uses for every layout box we synthesize.
 */
const BoxElement = "div";

/**
 * Values that override a paint declaration with a valid, invisible one.
 *
 * Satori merges `tw` first and `style` second, so an explicit style entry wins
 * over a Tailwind class. The values have to stay _valid_ CSS: Satori's style
 * normalizer rejects `undefined` and does not accept `none` for every property,
 * so "no paint" is expressed as a transparent color rather than as a removal.
 */
const PaintReset: Readonly<Record<string, string>> = {
  backgroundColor: "transparent",
  borderBottomColor: "transparent",
  borderColor: "transparent",
  borderLeftColor: "transparent",
  borderRightColor: "transparent",
  borderTopColor: "transparent",
};

/**
 * Resets that make Satori emit an (invisible) gradient or filter, so they are
 * only applied when the node can actually carry that kind of paint.
 */
const PaintResetExpensive: Readonly<Record<string, string>> = {
  backgroundImage: "linear-gradient(transparent, transparent)",
  boxShadow: "0 0 0 0 transparent",
  filter: "none",
};

/**
 * Style keys whose presence means the expensive resets are needed.
 */
const ExpensivePaintKeys: readonly string[] = [
  "background",
  "backgroundImage",
  "boxShadow",
  "filter",
];

export {
  BoxElement,
  ExpensivePaintKeys,
  NodeTokenProp,
  PaintReset,
  PaintResetExpensive,
  SvgMediaType,
  TextNodeType,
};
