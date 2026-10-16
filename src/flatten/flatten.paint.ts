import is from "@sindresorhus/is";
import type { Element, Node } from "@xmldom/xmldom";
import {
  Attribute,
  Paint,
  Pattern,
  ReferencedTags,
  ResourceTags,
  ShapeTags,
  Tag,
} from "@/flatten/flatten.constants.ts";
import {
  ancestorsOf,
  attributeOf,
  childElements,
  elementsOf,
  isElement,
  referencedIds,
  referencesIn,
  removeNode,
} from "@/flatten/flatten.dom.ts";

/**
 * Whether a color or paint value paints nothing.
 *
 * @param {string} value - A color or paint value.
 *
 * @returns {boolean} `true` for `none`, `transparent` and zero-alpha colors.
 */
const isInvisibleColor: (value: string) => boolean = (value: string): boolean =>
  Paint.invisible.has(value.trim().toLowerCase()) ||
  Pattern.invisibleColor.test(value.trim());

/**
 * Whether an element explicitly paints a color channel with nothing.
 *
 * @param {Element} element - The element to read.
 * @param {string} color - The color attribute.
 * @param {string} opacity - The matching opacity attribute.
 *
 * @returns {boolean} `true` when the color or its opacity is invisible.
 */
const isInvisible: (
  element: Element,
  color: string,
  opacity: string,
) => boolean = (element: Element, color: string, opacity: string): boolean => {
  const value: string | undefined = attributeOf(element, color);
  const alpha: string | undefined = attributeOf(element, opacity);
  return (
    (!is.undefined(value) && isInvisibleColor(value)) ||
    (!is.undefined(alpha) && Number(alpha) === 0)
  );
};

/**
 * Reads the id the first `url(#id)` of an attribute points at.
 *
 * @param {Element} element - The element to read.
 * @param {string} name - The attribute name.
 *
 * @returns {string | undefined} The referenced id, if any.
 */
const referenceOf: (element: Element, name: string) => string | undefined = (
  element: Element,
  name: string,
): string | undefined =>
  referencesIn(Attribute.style, attributeOf(element, name) ?? "")[0];

/**
 * Whether a filter always outputs transparent black: its result is a
 * transparent flood, or such a flood composited `in` anything.
 *
 * @param {Element} filter - The `<filter>` element.
 *
 * @returns {boolean} `true` when the filtered element can never be seen.
 */
const isTransparentFilter: (filter: Element) => boolean = (
  filter: Element,
): boolean => {
  const primitives: readonly Element[] = childElements(filter);
  const isTransparentFlood: (flood: Element | undefined) => boolean = (
    flood: Element | undefined,
  ): boolean =>
    !is.undefined(flood) &&
    flood.localName === Tag.feFlood &&
    isInvisible(flood, Attribute.floodColor, Attribute.floodOpacity);
  const last: Element | undefined = primitives.at(-1);
  if (is.undefined(last) || last.localName === Tag.feFlood) {
    return isTransparentFlood(last);
  }
  const input: string | undefined = attributeOf(last, Attribute.in);
  return (
    last.localName === Tag.feComposite &&
    attributeOf(last, Attribute.operator) === Paint.operatorIn &&
    isTransparentFlood(
      primitives.find(
        (primitive: Element): boolean =>
          !is.undefined(input) &&
          attributeOf(primitive, Attribute.result) === input,
      ),
    )
  );
};

/**
 * Whether a gradient only has transparent stops.
 *
 * @param {Element} gradient - A `<linearGradient>` or `<radialGradient>`.
 *
 * @returns {boolean} `true` when the gradient paints nothing.
 */
const isTransparentGradient: (gradient: Element) => boolean = (
  gradient: Element,
): boolean => {
  const stops: readonly Element[] = childElements(gradient);
  return (
    stops.length > 0 &&
    !gradient.hasAttribute(Attribute.href) &&
    stops.every(
      (stop: Element): boolean =>
        stop.localName === Tag.stop &&
        !stop.hasAttribute(Attribute.style) &&
        isInvisible(stop, Attribute.stopColor, Attribute.stopOpacity),
    )
  );
};

/**
 * Whether a shape draws nothing: neither its fill nor its stroke is visible. An
 * absent fill is black, and an absent stroke may be inherited, so both are
 * treated as visible unless proven otherwise.
 *
 * @param {Element} shape - The shape to inspect.
 * @param {ReadonlySet<string>} transparent - Ids of transparent paint servers.
 *
 * @returns {boolean} `true` when the shape can be removed.
 */
const isInvisibleShape: (
  shape: Element,
  transparent: ReadonlySet<string>,
) => boolean = (shape: Element, transparent: ReadonlySet<string>): boolean => {
  const isPaintInvisible: (name: string) => boolean = (
    name: string,
  ): boolean => {
    const value: string | undefined = attributeOf(shape, name);
    const server: string | undefined = referenceOf(shape, name);
    return (
      !is.undefined(value) &&
      (isInvisibleColor(value) ||
        (!is.undefined(server) && transparent.has(server)))
    );
  };
  const style: string = (attributeOf(shape, Attribute.style) ?? Paint.noOpStyle)
    .replace(Pattern.space, "")
    .replace(Pattern.styleEnd, "");
  const hasNoStroke: boolean =
    isPaintInvisible(Attribute.stroke) ||
    Number(attributeOf(shape, Attribute.strokeWidth) ?? Number.NaN) === 0 ||
    ![shape, ...ancestorsOf(shape)].some((node: Element): boolean =>
      node.hasAttribute(Attribute.stroke),
    );
  return (
    ShapeTags.has(shape.localName ?? "") &&
    style === Paint.noOpStyle &&
    !shape.hasAttribute(Attribute.id) &&
    isPaintInvisible(Attribute.fill) &&
    hasNoStroke
  );
};

/**
 * Collects the ids of the elements that match a predicate.
 *
 * @param {readonly Element[]} elements - The candidate elements.
 * @param {(element: Element) => boolean} predicate - The test to pass.
 *
 * @returns {ReadonlySet<string>} The ids of the matching elements.
 */
const idsWhere: (
  elements: readonly Element[],
  predicate: (element: Element) => boolean,
) => ReadonlySet<string> = (
  elements: readonly Element[],
  predicate: (element: Element) => boolean,
): ReadonlySet<string> =>
  new Set(
    elements
      .filter(predicate)
      .flatMap((element: Element): string[] =>
        [attributeOf(element, Attribute.id)].filter(is.string),
      ),
  );

/**
 * Collects the paint servers that paint nothing: gradients with transparent
 * stops only, and patterns whose content is invisible.
 *
 * @param {Element} root - The tree to scan.
 *
 * @returns {ReadonlySet<string>} The ids of the transparent paint servers.
 */
const transparentServers: (root: Element) => ReadonlySet<string> = (
  root: Element,
): ReadonlySet<string> => {
  const gradients: ReadonlySet<string> = idsWhere(
    [
      ...elementsOf(root, Tag.linearGradient),
      ...elementsOf(root, Tag.radialGradient),
    ],
    isTransparentGradient,
  );
  const patterns: ReadonlySet<string> = idsWhere(
    elementsOf(root, Tag.pattern),
    (pattern: Element): boolean =>
      !pattern.hasAttribute(Attribute.href) &&
      childElements(pattern)
        .filter(
          (child: Element): boolean =>
            child.localName !== Tag.linearGradient &&
            child.localName !== Tag.radialGradient,
        )
        .every((child: Element): boolean => isInvisibleShape(child, gradients)),
  );
  return new Set([...gradients, ...patterns]);
};

/**
 * Removes the resources nothing references anymore, until none is left, then
 * the `<defs>` they leave empty.
 *
 * @param {Element} root - The tree to clean.
 */
const removeUnreferenced: (root: Element) => void = (root: Element): void => {
  let unused: readonly Element[] = [];
  do {
    const referenced: ReadonlySet<string> = referencedIds(root);
    unused = elementsOf(root).filter(
      (element: Element): boolean =>
        ReferencedTags.has(element.localName ?? "") &&
        !referenced.has(attributeOf(element, Attribute.id) ?? ""),
    );
    for (const element of unused) removeNode(element);
  } while (unused.length > 0);
  for (const defs of elementsOf(root, Tag.defs)) {
    if (childElements(defs).length === 0) removeNode(defs);
  }
};

/**
 * Removes the elements that can never be seen: the ones drawn through a filter
 * whose output is transparent black, and the shapes whose fill and stroke are
 * both invisible.
 *
 * @param {Element} root - The layer to clean, edited in place.
 */
const removeInvisibleElements: (root: Element) => void = (
  root: Element,
): void => {
  const filters: ReadonlySet<string> = idsWhere(
    elementsOf(root, Tag.filter),
    isTransparentFilter,
  );
  const transparent: ReadonlySet<string> = transparentServers(root);
  for (const element of elementsOf(root)) {
    const isInResource: boolean = [element, ...ancestorsOf(element)].some(
      (node: Element): boolean => ResourceTags.has(node.localName ?? ""),
    );
    const filter: string | undefined = referenceOf(element, Attribute.filter);
    if (
      !isInResource &&
      ((!is.undefined(filter) && filters.has(filter)) ||
        isInvisibleShape(element, transparent))
    ) {
      removeNode(element);
    }
  }
};

/**
 * Removes the groups left without content — the invisible placeholders Satori
 * draws for pinned boxes, or groups whose content was invisible. Children are
 * visited before their parents, so nested empty groups go in one pass.
 *
 * @param {Element} root - The layer to clean, edited in place.
 */
const removeEmptyGroups: (root: Element) => void = (root: Element): void => {
  for (const group of elementsOf(root, Tag.group).toReversed()) {
    const isEmpty: boolean = Array.from(group.childNodes).every(
      (node: Node): boolean =>
        !isElement(node) && (node.nodeValue ?? "").trim().length === 0,
    );
    if (isEmpty && !group.hasAttribute(Attribute.id)) removeNode(group);
  }
};

/**
 * Removes the paint that can never be seen. Satori has no way to express "no
 * paint" for a value a Tailwind class sets, so the projection overrides it with
 * transparent gradients, shadows and backgrounds instead, and Satori turns
 * those into patterns, masks and filters. They draw nothing, yet every filter
 * and mask costs an offscreen pass on each animation frame. Unused resources —
 * such as Satori's overflow masks — are dropped along the way. A layer carrying
 * a stylesheet may paint any element through it, so only its unreferenced
 * resources are removed.
 *
 * @param {Element} root - The layer to clean, edited in place.
 */
const removeInvisiblePaint: (root: Element) => void = (root: Element): void => {
  if (elementsOf(root, Tag.style).length === 0) {
    removeInvisibleElements(root);
    removeEmptyGroups(root);
  }
  removeUnreferenced(root);
};

export { referenceOf, removeInvisiblePaint };
