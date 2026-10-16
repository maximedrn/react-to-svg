import is from "@sindresorhus/is";
import {
  type Attr,
  DOMParser,
  type Element,
  type Node,
  onErrorStopParsing,
  XMLSerializer,
} from "@xmldom/xmldom";
import {
  Attribute,
  FlattenMessages,
  Pattern,
  SvgMimeType,
  SvgNamespace,
  Tag,
} from "@/flatten/flatten.constants.ts";

const ElementNodeType = 1;

/**
 * Narrows a DOM node to an element.
 *
 * @param {Node} node - The node to inspect.
 *
 * @returns {boolean} `true` when the node is an element.
 */
const isElement: (node: Node) => node is Element = (
  node: Node,
): node is Element => node.nodeType === ElementNodeType;

/**
 * Parses SVG markup into its root `<svg>` element.
 *
 * @param {string} markup - The SVG markup to parse.
 *
 * @returns {Element} The root `<svg>` element.
 *
 * @throws {Error} When the markup is malformed or not an SVG document.
 */
const parseSvg: (markup: string) => Element = (markup: string): Element => {
  const root: Element | null = new DOMParser({
    onError: onErrorStopParsing,
  }).parseFromString(markup, SvgMimeType).documentElement;
  if (is.null(root) || root.localName !== Tag.svg) {
    throw new Error(FlattenMessages.notSvg);
  }
  return root;
};

/**
 * Parses SVG markup, reporting malformed input as `undefined`.
 *
 * @param {string} markup - The SVG markup to parse.
 *
 * @returns {Element | undefined} The root `<svg>` element, if any.
 */
const tryParseSvg: (markup: string) => Element | undefined = (
  markup: string,
): Element | undefined => {
  try {
    return parseSvg(markup);
  } catch {
    // Malformed markup is reported as `undefined`, for the caller to skip.
  }
};

/**
 * Serializes the children of an element, without the element itself. The
 * element is serialized whole and its own tags are cut off, so the children
 * inherit its namespace declarations instead of each repeating them.
 *
 * @param {Element} root - The element whose content is serialized.
 *
 * @returns {string} The markup of its children.
 */
const contentOf: (root: Element) => string = (root: Element): string => {
  if (root.childNodes.length === 0) return "";
  const markup: string = new XMLSerializer().serializeToString(root);
  return markup.slice(markup.indexOf(">") + 1, markup.lastIndexOf("</"));
};

/**
 * Snapshots the descendants of an element, so the tree can be edited while
 * iterating over them.
 *
 * @param {Element} root - The element to search.
 * @param {string} tag - The tag name to match, every element by default.
 *
 * @returns {readonly Element[]} The matching descendants, in document order.
 */
const elementsOf: (root: Element, tag?: string) => readonly Element[] = (
  root: Element,
  tag: string = Tag.all,
): readonly Element[] => Array.from(root.getElementsByTagName(tag));

/**
 * Lists the direct child elements of a node.
 *
 * @param {Node} node - The parent node.
 *
 * @returns {readonly Element[]} Its child elements.
 */
const childElements: (node: Node) => readonly Element[] = (
  node: Node,
): readonly Element[] => Array.from(node.childNodes).filter(isElement);

/**
 * Reads an attribute.
 *
 * @param {Element} element - The element to read.
 * @param {string} name - The attribute name.
 *
 * @returns {string | undefined} The attribute value, if present.
 */
const attributeOf: (element: Element, name: string) => string | undefined = (
  element: Element,
  name: string,
): string | undefined => element.getAttribute(name) ?? undefined;

/**
 * Reads an element's `href`, plain or in the legacy `xlink` namespace.
 *
 * @param {Element} element - The element to read.
 *
 * @returns {string | undefined} The reference, if present.
 */
const hrefOf: (element: Element) => string | undefined = (
  element: Element,
): string | undefined =>
  attributeOf(element, Attribute.href) ??
  element.getAttributeNS(SvgNamespace.xlink, Attribute.href) ??
  undefined;

/**
 * Lists the ids an attribute value points at, through `url(#id)` or `#id`.
 *
 * @param {string} name - The attribute name.
 * @param {string} value - The attribute value.
 *
 * @returns {readonly string[]} The referenced ids.
 */
const referencesIn: (name: string, value: string) => readonly string[] = (
  name: string,
  value: string,
): readonly string[] => {
  const href: string | undefined = name.endsWith(Attribute.href)
    ? value.match(Pattern.hrefReference)?.[1]
    : undefined;
  return is.undefined(href)
    ? Array.from(
        value.matchAll(Pattern.reference),
        (match: RegExpExecArray): string => match[1] ?? match[0],
      )
    : [href];
};

/**
 * Collects every id referenced anywhere in the tree, from an attribute or from
 * a stylesheet.
 *
 * @param {Element} root - The tree to scan.
 *
 * @returns {ReadonlySet<string>} The referenced ids.
 */
const referencedIds: (root: Element) => ReadonlySet<string> = (
  root: Element,
): ReadonlySet<string> =>
  new Set([
    ...[root, ...elementsOf(root)].flatMap((element: Element): string[] =>
      Array.from(element.attributes).flatMap(
        (attribute: Attr): readonly string[] =>
          referencesIn(attribute.name, attribute.value),
      ),
    ),
    ...elementsOf(root, Tag.style).flatMap(
      (style: Element): readonly string[] =>
        referencesIn(Attribute.style, style.textContent ?? ""),
    ),
  ]);

/**
 * Indexes the elements of a tree by id, in document order.
 *
 * @param {Element} root - The tree to index.
 *
 * @returns {ReadonlyMap<string, Element>} The elements, keyed by id.
 */
const elementsById: (root: Element) => ReadonlyMap<string, Element> = (
  root: Element,
): ReadonlyMap<string, Element> =>
  new Map(
    [root, ...elementsOf(root)].flatMap(
      (element: Element): [string, Element][] => {
        const id: string | undefined = attributeOf(element, Attribute.id);
        return is.undefined(id) ? [] : [[id, element]];
      },
    ),
  );

/**
 * Lists the ancestors of an element, from its parent up to the root.
 *
 * @param {Element} element - The element to start from.
 *
 * @returns {readonly Element[]} Its ancestor elements.
 */
const ancestorsOf: (element: Element) => readonly Element[] = (
  element: Element,
): readonly Element[] => {
  const ancestors: Element[] = [];
  for (
    let parent: Element | null = element.parentElement;
    !is.null(parent);
    parent = parent.parentElement
  ) {
    ancestors.push(parent);
  }
  return ancestors;
};

/**
 * Adds a class to an element, keeping the classes it already has.
 *
 * @param {Element} element - The element to update.
 * @param {string} className - The class to add.
 */
const addClass: (element: Element, className: string) => void = (
  element: Element,
  className: string,
): void => {
  const existing: string | undefined = attributeOf(
    element,
    Attribute.className,
  );
  element.setAttribute(
    Attribute.className,
    is.undefined(existing) ? className : `${existing} ${className}`,
  );
};

/**
 * Removes a node from its parent, if it has one.
 *
 * @param {Node} node - The node to detach.
 */
const removeNode: (node: Node) => void = (node: Node): void => {
  node.parentNode?.removeChild(node);
};

/**
 * Rewrites the ids an attribute defines or references.
 *
 * @param {string} name - The attribute name.
 * @param {string} value - The attribute value.
 * @param {(id: string) => string} rename - Maps an id to its replacement.
 *
 * @returns {string} The attribute value with its ids rewritten.
 */
const rewriteIds: (
  name: string,
  value: string,
  rename: (id: string) => string,
) => string = (
  name: string,
  value: string,
  rename: (id: string) => string,
): string => {
  if (name === Attribute.id) return rename(value);
  return name.endsWith(Attribute.href)
    ? value.replace(
        Pattern.hrefReference,
        (_match: string, id: string): string => `#${rename(id)}`,
      )
    : value.replace(
        Pattern.reference,
        (_match: string, id: string): string => `url(#${rename(id)})`,
      );
};

/**
 * Renumbers every id of a tree by order of appearance, and every reference to
 * them. Two trees with the same structure get the same ids, whatever their
 * original names.
 *
 * @param {Element} root - The tree whose ids are renamed.
 * @param {string} prefix - The prefix of the new ids.
 */
const numberIds: (root: Element, prefix: string) => void = (
  root: Element,
  prefix: string,
): void => {
  const renames: ReadonlyMap<string, string> = new Map(
    Array.from(
      elementsById(root).keys(),
      (id: string, index: number): [string, string] => [
        id,
        `${prefix}${index.toString(36)}`,
      ],
    ),
  );
  const rename: (id: string) => string = (id: string): string =>
    renames.get(id) ?? id;
  for (const element of [root, ...elementsOf(root)]) {
    for (const { name, value } of Array.from(element.attributes)) {
      const renamed: string = rewriteIds(name, value, rename);
      if (renamed !== value) element.setAttribute(name, renamed);
    }
  }
};

export {
  addClass,
  ancestorsOf,
  attributeOf,
  childElements,
  contentOf,
  elementsById,
  elementsOf,
  hrefOf,
  isElement,
  numberIds,
  parseSvg,
  referencedIds,
  referencesIn,
  removeNode,
  tryParseSvg,
};
