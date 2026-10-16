import is from "@sindresorhus/is";
import type { Attr, Element, Node } from "@xmldom/xmldom";
import { Prefix, ThemedAttributes } from "@/flatten/flatten.constants.ts";
import { addClass, attributeOf, isElement } from "@/flatten/flatten.dom.ts";
import type { ThemedColor, ThemeEdit } from "@/flatten/flatten.types.ts";

const ReferencePrefix = "url(";

/**
 * Records a difference between the themes when a class can carry it: a plain
 * color or opacity. A reference to a paint server cannot be themed this way.
 *
 * @param {ThemeEdit} edit - The differing attribute.
 * @param {ThemeEdit[]} edits - The accumulated edits.
 *
 * @returns {boolean} `true` when the difference was recorded.
 */
const recordEdit: (edit: ThemeEdit, edits: ThemeEdit[]) => boolean = (
  edit: ThemeEdit,
  edits: ThemeEdit[],
): boolean => {
  const isThemed: boolean =
    ThemedAttributes.has(edit.attribute) &&
    !edit.light.includes(ReferencePrefix) &&
    !edit.dark.includes(ReferencePrefix);
  if (isThemed) edits.push(edit);
  return isThemed;
};

/**
 * Compares the attributes of two elements at the same place in each theme.
 *
 * @param {Element} light - The element of the light layer.
 * @param {Element} dark - The element of the dark layer.
 * @param {ThemeEdit[]} edits - The accumulated edits.
 *
 * @returns {boolean} `true` when the elements only differ by themed values.
 */
const alignAttributes: (
  light: Element,
  dark: Element,
  edits: ThemeEdit[],
) => boolean = (light: Element, dark: Element, edits: ThemeEdit[]): boolean =>
  light.attributes.length === dark.attributes.length &&
  Array.from(light.attributes).every(({ name, value }: Attr): boolean => {
    const other: string | undefined = attributeOf(dark, name);
    return (
      !is.undefined(other) &&
      (other === value ||
        recordEdit(
          { attribute: name, dark: other, element: light, light: value },
          edits,
        ))
    );
  });

/**
 * Compares two nodes at the same place in each theme, recursively. Both layers
 * had their ids numbered by order of appearance, so equal structures carry
 * equal ids.
 *
 * @param {Node} light - The node of the light layer.
 * @param {Node} dark - The node of the dark layer.
 * @param {ThemeEdit[]} edits - The accumulated edits.
 *
 * @returns {boolean} `true` when the nodes only differ by themed values.
 */
const alignLayers: (light: Node, dark: Node, edits: ThemeEdit[]) => boolean = (
  light: Node,
  dark: Node,
  edits: ThemeEdit[],
): boolean => {
  if (light.nodeType !== dark.nodeType) return false;
  if (!(isElement(light) && isElement(dark))) {
    return light.nodeValue === dark.nodeValue;
  }
  const lights: readonly Node[] = Array.from(light.childNodes);
  const darks: readonly Node[] = Array.from(dark.childNodes);
  return (
    light.localName === dark.localName &&
    lights.length === darks.length &&
    alignAttributes(light, dark, edits) &&
    lights.every((child: Node, index: number): boolean => {
      const other: Node | undefined = darks[index];
      return !is.undefined(other) && alignLayers(child, other, edits);
    })
  );
};

/**
 * Moves the recorded differences into classes on the light layers, sharing one
 * class per distinct pair of values across the whole document.
 *
 * @param {readonly ThemeEdit[]} edits - The values the themes disagree on.
 *
 * @returns {readonly ThemedColor[]} The themed values, one per class.
 */
const applyEdits: (edits: readonly ThemeEdit[]) => readonly ThemedColor[] = (
  edits: readonly ThemeEdit[],
): readonly ThemedColor[] => {
  const colors: Map<string, ThemedColor> = new Map();
  for (const edit of edits) {
    const key: string = [edit.attribute, edit.light, edit.dark].join("\n");
    const color: ThemedColor = colors.get(key) ?? {
      className: `${Prefix.className}${colors.size.toString(36)}`,
      dark: edit.dark,
      light: edit.light,
      property: edit.attribute,
    };
    colors.set(key, color);
    edit.element.removeAttribute(edit.attribute);
    addClass(edit.element, color.className);
  }
  return [...colors.values()];
};

export { alignLayers, applyEdits };
