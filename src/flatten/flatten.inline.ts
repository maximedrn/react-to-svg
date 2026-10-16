import is from "@sindresorhus/is";
import type { Attr, Document, Element } from "@xmldom/xmldom";
import {
  Attribute,
  BoxRectAttributes,
  ImageViewportAttributes,
  LeakedAttributes,
  NonPortableTags,
  Paint,
  Pattern,
  Prefix,
  SvgDataUri,
  SvgNamespace,
  Tag,
  ViewportAttributes,
} from "@/flatten/flatten.constants.ts";
import {
  attributeOf,
  childElements,
  elementsById,
  elementsOf,
  hrefOf,
  numberIds,
  tryParseSvg,
} from "@/flatten/flatten.dom.ts";
import { referenceOf } from "@/flatten/flatten.paint.ts";
import type { EmbeddedSvg, SvgBox } from "@/flatten/flatten.types.ts";

type SvgAttribute = readonly [string, string];

const Base64Marker = ";base64";
const ViewBoxLength = 4;
const XmlnsPrefix = "xmlns";

/**
 * Decodes an SVG data URI, whether base64- or percent-encoded.
 *
 * @param {string} href - The `href` of an `<image>`.
 *
 * @returns {string | undefined} The embedded SVG markup, if any.
 */
const decodeSvgDataUri: (href: string) => string | undefined = (
  href: string,
): string | undefined => {
  const comma: number = href.indexOf(",");
  if (!href.startsWith(SvgDataUri) || comma < 0) return;
  const payload: string = href.slice(comma + 1);
  if (href.slice(0, comma).endsWith(Base64Marker)) {
    return Buffer.from(payload, "base64").toString("utf8");
  }
  try {
    return decodeURIComponent(payload);
  } catch {
    // A malformed escape leaves the image embedded.
  }
};

/**
 * Reads a strictly numeric attribute.
 *
 * @param {Element} element - The element to read.
 * @param {string} name - The attribute name.
 * @param {number} fallback - The value of an absent attribute.
 *
 * @returns {number | undefined} The value, or `undefined` when it has units.
 */
const numberOf: (
  element: Element,
  name: string,
  fallback: number,
) => number | undefined = (
  element: Element,
  name: string,
  fallback: number,
): number | undefined => {
  const value: number = Number(attributeOf(element, name) ?? fallback);
  return Number.isFinite(value) ? value : undefined;
};

/**
 * Reads the box an element occupies in its parent's user space.
 *
 * @param {Element} element - An `<image>` or a `<rect>`.
 *
 * @returns {SvgBox | undefined} Its box, when every side is numeric.
 */
const boxOf: (element: Element) => SvgBox | undefined = (
  element: Element,
): SvgBox | undefined => {
  const height: number | undefined = numberOf(
    element,
    Attribute.height,
    Number.NaN,
  );
  const width: number | undefined = numberOf(
    element,
    Attribute.width,
    Number.NaN,
  );
  const x: number | undefined = numberOf(element, Attribute.x, 0);
  const y: number | undefined = numberOf(element, Attribute.y, 0);
  return is.undefined(height) ||
    is.undefined(width) ||
    is.undefined(x) ||
    is.undefined(y)
    ? undefined
    : { height, width, x, y };
};

/**
 * Whether two boxes cover exactly the same area.
 *
 * @param {SvgBox} left - The first box.
 * @param {SvgBox | undefined} right - The second box.
 *
 * @returns {boolean} `true` when both boxes are identical.
 */
const isSameBox: (left: SvgBox, right: SvgBox | undefined) => boolean = (
  left: SvgBox,
  right: SvgBox | undefined,
): boolean =>
  !is.undefined(right) &&
  left.x === right.x &&
  left.y === right.y &&
  left.width === right.width &&
  left.height === right.height;

/**
 * Reads the coordinate system of an embedded document.
 *
 * @param {Element} root - The embedded `<svg>` root.
 *
 * @returns {readonly number[] | undefined} Its `viewBox`, or one derived from a
 *   numeric size.
 */
const viewBoxOf: (root: Element) => readonly number[] | undefined = (
  root: Element,
): readonly number[] | undefined => {
  const viewBox: string | undefined = attributeOf(root, Attribute.viewBox);
  if (is.undefined(viewBox)) {
    const box: SvgBox | undefined = boxOf(root);
    return is.undefined(box) ? undefined : [0, 0, box.width, box.height];
  }
  const values: number[] = viewBox.trim().split(Pattern.viewBox).map(Number);
  return values.length === ViewBoxLength && values.every(Number.isFinite)
    ? values
    : undefined;
};

/**
 * Reads and parses the SVG document an `<image>` embeds, when its content
 * renders the same once moved into the host: no stylesheet or script leaks, and
 * no color is inherited from the context it is drawn in.
 *
 * @param {Element} image - The `<image>` element.
 *
 * @returns {EmbeddedSvg | undefined} The embedded document, if it is portable.
 */
const embeddedSvgOf: (image: Element) => EmbeddedSvg | undefined = (
  image: Element,
): EmbeddedSvg | undefined => {
  const markup: string | undefined = decodeSvgDataUri(hrefOf(image) ?? "");
  const root: Element | undefined = is.undefined(markup)
    ? undefined
    : tryParseSvg(markup);
  const box: SvgBox | undefined = boxOf(image);
  const viewBox: readonly number[] | undefined = is.undefined(root)
    ? undefined
    : viewBoxOf(root);
  const isPortable: boolean =
    !(is.undefined(root) || Pattern.currentColor.test(markup ?? "")) &&
    NonPortableTags.every(
      (tag: string): boolean => elementsOf(root, tag).length === 0,
    );
  return isPortable &&
    !is.undefined(root) &&
    !is.undefined(box) &&
    !is.undefined(viewBox)
    ? { box, root, viewBox }
    : undefined;
};

/**
 * Whether a clip path or mask only repeats the box the content is already
 * clipped to by its own viewport: a single rectangle covering exactly that box,
 * opaque white for a mask.
 *
 * @param {Element | undefined} resource - The `<clipPath>` or `<mask>`.
 * @param {SvgBox} box - The box of the inlined image.
 *
 * @returns {boolean} `true` when dropping the reference changes nothing.
 */
const isBoxResource: (resource: Element | undefined, box: SvgBox) => boolean = (
  resource: Element | undefined,
  box: SvgBox,
): boolean => {
  if (is.undefined(resource)) return false;
  const shapes: readonly Element[] = childElements(resource);
  const isMask: boolean = resource.localName === Tag.mask;
  return (
    shapes.length === 1 &&
    resource.attributes.length === 1 &&
    shapes.every(
      (shape: Element): boolean =>
        shape.localName === Tag.rect &&
        Array.from(shape.attributes).every((attribute: Attr): boolean =>
          BoxRectAttributes.has(attribute.name),
        ) &&
        (!isMask ||
          Paint.white.has(
            (attributeOf(shape, Attribute.fill) ?? "").toLowerCase(),
          )) &&
        isSameBox(box, boxOf(shape)),
    )
  );
};

/**
 * Lists the attributes of an element as name and value pairs.
 *
 * @param {Element} element - The element to read.
 *
 * @returns {readonly SvgAttribute[]} Its attributes.
 */
const attributesOf: (element: Element) => readonly SvgAttribute[] = (
  element: Element,
): readonly SvgAttribute[] =>
  Array.from(element.attributes, (attribute: Attr): SvgAttribute => [
    attribute.name,
    attribute.value,
  ]);

/**
 * Lists the attributes of an `<image>` that still have an effect once it is
 * replaced by a nested viewport: its placement is consumed by the viewport,
 * `filter: none` never had an effect, and a clip path or mask that only repeats
 * the image's own box is already enforced by the viewport.
 *
 * @param {Element} image - The image being replaced.
 * @param {SvgBox} box - Its box.
 * @param {ReadonlyMap<string, Element>} resources - The host's elements by id.
 *
 * @returns {readonly SvgAttribute[]} The attributes to keep.
 */
const effectiveAttributes: (
  image: Element,
  box: SvgBox,
  resources: ReadonlyMap<string, Element>,
) => readonly SvgAttribute[] = (
  image: Element,
  box: SvgBox,
  resources: ReadonlyMap<string, Element>,
): readonly SvgAttribute[] =>
  attributesOf(image).filter(([name, value]: SvgAttribute): boolean => {
    if (ImageViewportAttributes.has(name)) return false;
    if (name === Attribute.style) {
      return (
        value.replace(Pattern.space, "").replace(Pattern.styleEnd, "") !==
        Paint.noOpStyle
      );
    }
    if (name !== Attribute.clipPath && name !== Attribute.mask) return true;
    const id: string | undefined = referenceOf(image, name);
    return !isBoxResource(
      is.undefined(id) ? undefined : resources.get(id),
      box,
    );
  });

/**
 * Builds the nested `<svg>` viewport that replaces an `<image>`: same
 * placement, scaling and clipping, with the embedded document's children and
 * inherited root attributes, wrapped in a group for the image's own effects.
 *
 * @param {Document} document - The host document.
 * @param {Element} image - The image being replaced.
 * @param {EmbeddedSvg} embedded - The document it embeds.
 * @param {ReadonlyMap<string, Element>} resources - The host's elements by id.
 *
 * @returns {Element} The replacement element.
 */
const buildViewport: (
  document: Document,
  image: Element,
  embedded: EmbeddedSvg,
  resources: ReadonlyMap<string, Element>,
) => Element = (
  document: Document,
  image: Element,
  embedded: EmbeddedSvg,
  resources: ReadonlyMap<string, Element>,
): Element => {
  const viewport: Element = document.createElementNS(SvgNamespace.svg, Tag.svg);
  const { box } = embedded;
  if (box.x !== 0) viewport.setAttribute(Attribute.x, String(box.x));
  if (box.y !== 0) viewport.setAttribute(Attribute.y, String(box.y));
  viewport.setAttribute(Attribute.width, String(box.width));
  viewport.setAttribute(Attribute.height, String(box.height));
  viewport.setAttribute(Attribute.viewBox, embedded.viewBox.join(" "));
  const aspect: string | undefined = attributeOf(
    image,
    Attribute.preserveAspectRatio,
  );
  if (!is.undefined(aspect)) {
    viewport.setAttribute(Attribute.preserveAspectRatio, aspect);
  }
  for (const [name, value] of attributesOf(embedded.root)) {
    if (!(ViewportAttributes.has(name) || name.startsWith(XmlnsPrefix))) {
      viewport.setAttribute(name, value);
    }
  }
  for (const child of Array.from(embedded.root.childNodes)) {
    viewport.appendChild(document.importNode(child, true));
  }
  const kept: readonly SvgAttribute[] = effectiveAttributes(
    image,
    box,
    resources,
  );
  if (kept.length === 0) return viewport;
  const group: Element = document.createElementNS(SvgNamespace.svg, Tag.group);
  for (const [name, value] of kept) group.setAttribute(name, value);
  group.appendChild(viewport);
  return group;
};

/**
 * Replaces every `<image>` that embeds an SVG document — Satori's rendering of
 * an inline `<svg>` child, such as an icon — with the document's content in a
 * nested viewport. The browser then parses one document instead of one per
 * icon, and the icon's colors become plain attributes the themes can share. The
 * ids of each embedded document are renamed first, as they were only unique
 * within it.
 *
 * @param {Element} root - The layer whose images are inlined, edited in place.
 */
const inlineImages: (root: Element) => void = (root: Element): void => {
  const resources: ReadonlyMap<string, Element> = elementsById(root);
  for (const [index, image] of elementsOf(root, Tag.image).entries()) {
    const embedded: EmbeddedSvg | undefined = embeddedSvgOf(image);
    const document: Document | null = image.ownerDocument;
    if (!(is.undefined(embedded) || is.null(document))) {
      for (const element of [embedded.root, ...elementsOf(embedded.root)]) {
        for (const name of LeakedAttributes) element.removeAttribute(name);
      }
      inlineImages(embedded.root);
      numberIds(embedded.root, `${Prefix.embedded}${index.toString(36)}-`);
      image.parentNode?.replaceChild(
        buildViewport(document, image, embedded, resources),
        image,
      );
    }
  }
};

export { inlineImages };
