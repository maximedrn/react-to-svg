import { describe, expect, it } from "bun:test";
import is from "@sindresorhus/is";
import { createElement } from "react";
import { compileAnimations } from "@/animate/animate.css.ts";
import { CompositionKind, DarkMedia } from "@/compose/compose.constants.ts";
import { SvgDocument } from "@/compose/compose.document.tsx";
import { layersOf } from "@/compose/compose.themes.ts";
import type { Composition, LayerMarkup } from "@/compose/compose.types.ts";
import type { Layer, LayerTree } from "@/layer/layer.types.ts";
import { ThemeVariant } from "@/render.types.ts";
import { resolveTree } from "@/resolve/resolve.renderer.ts";
import {
  type ElementNode,
  isTextNode,
  type ResolvedNode,
} from "@/resolve/resolve.types.ts";
import {
  Expected,
  Height,
  SampleMarkup,
  Theme,
  ThemedFill,
  Width,
} from "@/test/test.constants.ts";
import { layerTree } from "@/test/test.scopes.ts";
import { at, elementsOf, flatten, propsOf, styleOf } from "@/test/test.tree.ts";

const markupOf: (...trees: readonly LayerTree[]) => LayerMarkup = (
  ...trees: readonly LayerTree[]
): LayerMarkup =>
  new Map(
    trees
      .flatMap(layersOf)
      .map((layer: Layer): [Layer, string] => [layer, SampleMarkup]),
  );

const split: () => Composition = (): Composition => {
  const dark: LayerTree = compileAnimations(layerTree(), "a-dark-");
  const light: LayerTree = compileAnimations(layerTree(), "a-light-");
  return {
    kind: CompositionKind.split,
    markup: markupOf(dark, light),
    trees: { dark, light },
  };
};

const merged: () => Composition = (): Composition => {
  const tree: LayerTree = compileAnimations(layerTree(), "a-");
  return {
    colors: [ThemedFill],
    kind: CompositionKind.merged,
    markup: markupOf(tree),
    tree,
  };
};

const documentOf: (composition: Composition) => ElementNode = (
  composition: Composition,
): ElementNode =>
  resolveTree(
    createElement(SvgDocument, {
      composition,
      theme: Theme,
      viewport: { height: Height, width: Width },
    }),
  );

const stylesheetOf: (root: ElementNode) => string = (
  root: ElementNode,
): string => {
  const text: ResolvedNode | undefined = at(elementsOf(root), 1).children[0];
  return !is.undefined(text) && isTextNode(text) ? text.text : "";
};

const themeGroupsOf: (root: ElementNode) => readonly ElementNode[] = (
  root: ElementNode,
): readonly ElementNode[] =>
  elementsOf(root).filter(
    (element: ElementNode): boolean =>
      element.type === "g" && !is.undefined(propsOf(element).className),
  );

describe("'SvgDocument'.", (): void => {
  it("Emits one titled, viewport-sized root.", (): void => {
    const root: ElementNode = documentOf(split());

    expect(root.type).toBe("svg");
    expect(propsOf(root).viewBox).toBe("0 0 200 120");
    expect(at(elementsOf(root), 0).type).toBe("title");
  });

  it("Carries the theme stylesheet inline when the themes are split.", (): void => {
    const css: string = stylesheetOf(documentOf(split()));

    expect(css).toContain(Theme);
    expect(css).toContain("@keyframes a-dark-0");
    expect(css).toContain("@keyframes a-light-0");
  });

  it("Emits one class-scoped group per split theme.", (): void => {
    expect(
      themeGroupsOf(documentOf(split())).map(
        (group: ElementNode): unknown => propsOf(group).className,
      ),
    ).toEqual([ThemeVariant.dark, ThemeVariant.light]);
  });

  it("Draws merged themes once, their colors following the color scheme.", (): void => {
    const root: ElementNode = documentOf(merged());
    const css: string = stylesheetOf(root);

    expect(themeGroupsOf(root)).toHaveLength(0);
    expect(css).not.toContain(Theme);
    expect(css).toContain("@keyframes a-0");
    expect(css).toContain(
      `.${ThemedFill.className}{fill:${ThemedFill.light}}${DarkMedia}{.${ThemedFill.className}{fill:${ThemedFill.dark}}}`,
    );
  });

  it("Inlines each layer's flattened markup.", (): void => {
    const layers: readonly ElementNode[] = flatten(documentOf(split())).filter(
      (element: ElementNode): boolean =>
        element.type === "g" &&
        !is.undefined(propsOf(element).dangerouslySetInnerHTML),
    );

    expect(layers).toHaveLength(Expected.layers);
    expect(propsOf(at(layers, 0)).dangerouslySetInnerHTML).toEqual({
      __html: SampleMarkup,
    });
    expect(
      flatten(documentOf(split())).some(
        (element: ElementNode): boolean => element.type === "image",
      ),
    ).toBe(false);
  });

  it("Nests a child scope's layer inside its parent's group.", (): void => {
    const theme: ElementNode = at(themeGroupsOf(documentOf(split())), 0);
    const outer: ElementNode = at(elementsOf(theme), 1);
    const inner: ElementNode | undefined = elementsOf(outer).find(
      (element: ElementNode): boolean =>
        element.type === "g" && !is.undefined(styleOf(element).animation),
    );

    expect(
      propsOf(at(elementsOf(theme), 0)).dangerouslySetInnerHTML,
    ).toBeDefined();
    expect(styleOf(outer).animation).toContain("a-dark-0");
    expect(inner).toBeDefined();
    expect(styleOf(inner ?? outer).animation).toContain("a-dark-1");
  });
});
