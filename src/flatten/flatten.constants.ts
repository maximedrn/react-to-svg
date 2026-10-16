/**
 * Media type Satori layers and embedded images are parsed as.
 */
const SvgMimeType = "image/svg+xml";

/**
 * Namespaces of the markup Satori emits.
 */
const SvgNamespace = {
  svg: "http://www.w3.org/2000/svg",
  xlink: "http://www.w3.org/1999/xlink",
} as const;

/**
 * Prefix of the data URIs Satori embeds an inline `<svg>` child with.
 */
const SvgDataUri = "data:image/svg+xml";

/**
 * Element names the flattening step reads or writes.
 */
const Tag = {
  all: "*",
  clipPath: "clipPath",
  defs: "defs",
  feComposite: "feComposite",
  feFlood: "feFlood",
  filter: "filter",
  foreignObject: "foreignObject",
  group: "g",
  image: "image",
  linearGradient: "linearGradient",
  mask: "mask",
  pattern: "pattern",
  radialGradient: "radialGradient",
  rect: "rect",
  script: "script",
  stop: "stop",
  style: "style",
  svg: "svg",
} as const;

/**
 * Attribute names the flattening step reads or writes.
 */
const Attribute = {
  className: "class",
  clipPath: "clip-path",
  fill: "fill",
  filter: "filter",
  floodColor: "flood-color",
  floodOpacity: "flood-opacity",
  height: "height",
  href: "href",
  id: "id",
  in: "in",
  mask: "mask",
  operator: "operator",
  preserveAspectRatio: "preserveAspectRatio",
  result: "result",
  stopColor: "stop-color",
  stopOpacity: "stop-opacity",
  stroke: "stroke",
  strokeWidth: "stroke-width",
  style: "style",
  viewBox: "viewBox",
  width: "width",
  x: "x",
  y: "y",
} as const;

/**
 * Elements whose content is only rendered when referenced, never in place.
 */
const ResourceTags: ReadonlySet<string> = new Set([
  Tag.clipPath,
  Tag.defs,
  Tag.filter,
  Tag.linearGradient,
  Tag.mask,
  Tag.pattern,
  Tag.radialGradient,
  "marker",
  "symbol",
]);

/**
 * Resources that can be dropped once nothing references them anymore.
 */
const ReferencedTags: ReadonlySet<string> = new Set([
  Tag.clipPath,
  Tag.filter,
  Tag.linearGradient,
  Tag.mask,
  Tag.pattern,
  Tag.radialGradient,
]);

/**
 * Basic shapes, which draw nothing once their fill and stroke are invisible.
 */
const ShapeTags: ReadonlySet<string> = new Set([
  "circle",
  "ellipse",
  "line",
  "path",
  "polygon",
  "polyline",
  Tag.rect,
]);

/**
 * Content that cannot be moved into another document without rewriting it.
 */
const NonPortableTags: readonly string[] = [
  Tag.foreignObject,
  Tag.script,
  Tag.style,
];

/**
 * Props Satori copies verbatim into the markup of an inline `<svg>` child,
 * which mean nothing in SVG.
 */
const LeakedAttributes: readonly string[] = ["tw"];

/**
 * Root attributes that only describe an embedded document's own viewport.
 */
const ViewportAttributes: ReadonlySet<string> = new Set([
  "baseProfile",
  Attribute.height,
  Attribute.preserveAspectRatio,
  "version",
  Attribute.viewBox,
  Attribute.width,
  Attribute.x,
  "xmlns",
  Attribute.y,
]);

/**
 * `<image>` attributes consumed while replacing it by a nested viewport.
 */
const ImageViewportAttributes: ReadonlySet<string> = new Set([
  Attribute.height,
  Attribute.href,
  Attribute.preserveAspectRatio,
  Attribute.width,
  Attribute.x,
  "xlink:href",
  Attribute.y,
]);

/**
 * Attributes a clip or mask rectangle may carry while still being a box.
 */
const BoxRectAttributes: ReadonlySet<string> = new Set([
  Attribute.fill,
  Attribute.height,
  Attribute.width,
  Attribute.x,
  Attribute.y,
]);

/**
 * Attributes that only carry a color or an opacity: the two themes may disagree
 * on them, a class whose value follows the color scheme carries them.
 */
const ThemedAttributes: ReadonlySet<string> = new Set([
  "color",
  Attribute.fill,
  "fill-opacity",
  Attribute.floodColor,
  Attribute.floodOpacity,
  "lighting-color",
  "opacity",
  Attribute.stopColor,
  Attribute.stopOpacity,
  Attribute.stroke,
  "stroke-opacity",
]);

/**
 * Paint keywords and fill colors with a fixed meaning.
 */
const Paint = {
  invisible: new Set(["none", "transparent"]) as ReadonlySet<string>,
  noOpStyle: "filter:none",
  operatorIn: "in",
  white: new Set(["#fff", "#ffffff", "white"]) as ReadonlySet<string>,
} as const;

/**
 * Patterns matched against attribute values.
 */
const Pattern = {
  currentColor: /currentColor/i,
  hrefReference: /^#(.+)$/,
  invisibleColor: /^(?:transparent|rgba?\([^)]*,\s*0(?:\.0*)?\s*\))$/i,
  reference: /url\(\s*['"]?#([^'")\s]+)['"]?\s*\)/g,
  space: /\s+/g,
  styleEnd: /;$/,
  viewBox: /[\s,]+/,
} as const;

/**
 * Prefixes of the generated ids and classes.
 */
const Prefix = {
  className: "t",
  embedded: "e",
} as const;

/**
 * Messages for the errors raised while flattening a layer.
 */
const FlattenMessages = {
  notSvg: "Expected a Satori layer to be an SVG document.",
} as const;

export {
  Attribute,
  BoxRectAttributes,
  FlattenMessages,
  ImageViewportAttributes,
  LeakedAttributes,
  NonPortableTags,
  Paint,
  Pattern,
  Prefix,
  ReferencedTags,
  ResourceTags,
  ShapeTags,
  SvgDataUri,
  SvgMimeType,
  SvgNamespace,
  Tag,
  ThemedAttributes,
  ViewportAttributes,
};
