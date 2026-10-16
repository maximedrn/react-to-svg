import is from "@sindresorhus/is";
import {
  DOMParser,
  type Element,
  type Node,
  onErrorStopParsing,
} from "@xmldom/xmldom";
import { SvgSyntax, SvgTestErrors } from "@/test/test.svg.constants.ts";

interface SvgFrame {
  readonly height: number;
  readonly viewBox: readonly number[];
  readonly width: number;
}
interface SvgLayer {
  readonly fills: readonly string[];
  readonly shadowColors: readonly string[];
}
interface SvgOutput {
  readonly frame: SvgFrame;
  readonly themes: ReadonlyMap<string, readonly SvgLayer[]>;
}

/**
 * The themed class rules a theme sees: class name, then property, then value.
 */
type ThemeRules = ReadonlyMap<string, ReadonlyMap<string, string>>;

const attribute: (element: Element, name: string) => string = (
  element: Element,
  name: string,
): string => {
  const value: string | null = element.getAttribute(name);
  if (is.null(value)) throw new Error(SvgTestErrors.attribute(name));
  return value;
};

const parseRoot: (markup: string) => Element = (markup: string): Element => {
  const root: Element | null = new DOMParser({
    onError: onErrorStopParsing,
  }).parseFromString(markup, SvgSyntax.mimeType).documentElement;
  if (is.null(root) || root.tagName !== SvgSyntax.tags.svg)
    throw new Error(SvgTestErrors.root);
  return root;
};

const frameOf: (root: Element) => SvgFrame = (root: Element): SvgFrame => ({
  height: Number(attribute(root, SvgSyntax.attributes.height)),
  viewBox: attribute(root, SvgSyntax.attributes.viewBox)
    .split(SvgSyntax.whitespace)
    .map(Number),
  width: Number(attribute(root, SvgSyntax.attributes.width)),
});

const childGroups: (element: Element) => readonly Element[] = (
  element: Element,
): readonly Element[] =>
  Array.from(element.childNodes).filter(
    (node: Node): node is Element =>
      node.nodeType === node.ELEMENT_NODE &&
      (node as Element).tagName === SvgSyntax.tags.group,
  );

/**
 * Reads the class rules of one theme: the default rules, overridden by the dark
 * media query for the dark theme.
 */
const themeRulesOf: (root: Element, theme: string) => ThemeRules = (
  root: Element,
  theme: string,
): ThemeRules => {
  const css: string = Array.from(
    root.getElementsByTagName(SvgSyntax.tags.style),
    (style: Element): string => style.textContent ?? "",
  ).join("");
  const dark: string = css.match(SvgSyntax.darkRules)?.[1] ?? "";
  const rules: Map<string, Map<string, string>> = new Map();
  const read: (source: string) => void = (source: string): void => {
    for (const [, name = "", property = "", value = ""] of source.matchAll(
      SvgSyntax.rule,
    )) {
      rules.set(name, (rules.get(name) ?? new Map()).set(property, value));
    }
  };
  read(css.replace(SvgSyntax.darkRules, ""));
  if (theme === SvgSyntax.themes[0]) read(dark);
  return rules;
};

/**
 * Reads the value a theme paints an attribute with: the attribute itself, or
 * the themed class rule that replaced it.
 */
const paintOf: (
  element: Element,
  name: string,
  rules: ThemeRules,
) => string | undefined = (
  element: Element,
  name: string,
  rules: ThemeRules,
): string | undefined =>
  element.getAttribute(name) ??
  (element.getAttribute(SvgSyntax.attributes.className) ?? "")
    .split(SvgSyntax.whitespace)
    .map((className: string): string | undefined =>
      rules.get(className)?.get(name),
    )
    .find(is.string);

const readLayer: (content: Element, rules: ThemeRules) => SvgLayer = (
  content: Element,
  rules: ThemeRules,
): SvgLayer => {
  const elements: readonly Element[] = [
    content,
    ...Array.from(content.getElementsByTagName(SvgSyntax.tags.all)),
  ];
  return {
    fills: elements
      .map((element: Element): string | undefined =>
        paintOf(element, SvgSyntax.attributes.fill, rules),
      )
      .filter(is.string),
    shadowColors: elements
      .filter(
        (element: Element): boolean => element.tagName === SvgSyntax.tags.flood,
      )
      .map((element: Element): string | undefined =>
        paintOf(element, SvgSyntax.attributes.floodColor, rules),
      )
      .filter(
        (color: string | undefined): color is string =>
          is.string(color) && color !== SvgSyntax.transparent,
      ),
  };
};

/**
 * Lists the layers drawn in a container, in document order: each layer's
 * content is a plain group, and each nested scope wraps its own layers in a
 * group carrying its animation.
 */
const layersIn: (container: Element, rules: ThemeRules) => SvgLayer[] = (
  container: Element,
  rules: ThemeRules,
): SvgLayer[] =>
  childGroups(container).flatMap((group: Element): SvgLayer[] =>
    (group.getAttribute(SvgSyntax.attributes.style) ?? "").includes(
      SvgSyntax.animation,
    )
      ? layersIn(group, rules)
      : [readLayer(group, rules)],
  );

/**
 * Reads a composed document theme by theme. Split themes are read from their
 * own groups; merged themes share one drawing, read with each theme's colors.
 */
const readSvg: (markup: string) => SvgOutput = (markup: string): SvgOutput => {
  const root: Element = parseRoot(markup);
  const groups: readonly Element[] = childGroups(root).filter(
    (group: Element): boolean =>
      group.hasAttribute(SvgSyntax.attributes.className),
  );
  return {
    frame: frameOf(root),
    themes: new Map(
      groups.length === 0
        ? SvgSyntax.themes.map((theme: string): [string, SvgLayer[]] => [
            theme,
            layersIn(root, themeRulesOf(root, theme)),
          ])
        : groups.map((group: Element): [string, SvgLayer[]] => {
            const theme: string = attribute(
              group,
              SvgSyntax.attributes.className,
            );
            return [theme, layersIn(group, themeRulesOf(root, theme))];
          }),
    ),
  };
};

const themeLayers: (output: SvgOutput, theme: string) => readonly SvgLayer[] = (
  output: SvgOutput,
  theme: string,
): readonly SvgLayer[] => {
  const layers: readonly SvgLayer[] | undefined = output.themes.get(theme);
  if (is.undefined(layers)) throw new Error(SvgTestErrors.theme(theme));
  return layers;
};

export type { SvgFrame, SvgLayer, SvgOutput };
export { readSvg, themeLayers };
