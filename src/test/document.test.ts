import { describe, expect, it } from "bun:test";
import is from "@sindresorhus/is";
import { createElement } from "react";
import { compileAnimations } from "@/animate/animate.css.ts";
import { SvgDocument } from "@/compose/compose.document.tsx";
import { ThemeVariant } from "@/render.types.ts";
import { resolveTree } from "@/resolve/resolve.renderer.ts";
import {
  type ElementNode,
  isTextNode,
  type ResolvedNode,
} from "@/resolve/resolve.types.ts";
import { Expected, Height, Theme, Width } from "@/test/test.constants.ts";
import { layerTree } from "@/test/test.scopes.ts";
import { at, elementsOf, flatten, propsOf, styleOf } from "@/test/test.tree.ts";

describe("'SvgDocument'.", (): void => {
  const document: () => ElementNode = (): ElementNode =>
    resolveTree(
      createElement(SvgDocument, {
        layers: {
          dark: compileAnimations(layerTree(), "a-dark-"),
          light: compileAnimations(layerTree(), "a-light-"),
        },
        theme: Theme,
        viewport: { height: Height, width: Width },
      }),
    );

  it("Emits one titled, viewport-sized root.", (): void => {
    const root: ElementNode = document();

    expect(root.type).toBe("svg");
    expect(propsOf(root).viewBox).toBe("0 0 200 120");
    expect(at(elementsOf(root), 0).type).toBe("title");
  });

  it("Carries the theme stylesheet inline.", (): void => {
    const style: ElementNode = at(elementsOf(document()), 1);
    const text: ResolvedNode | undefined = style.children[0];

    const css: string =
      !is.undefined(text) && isTextNode(text) ? text.text : "";

    expect(style.type).toBe("style");
    expect(css).toContain(Theme);
    expect(css).toContain("@keyframes a-dark-0");
  });

  it("Emits one class-scoped group per theme.", (): void => {
    const groups: readonly ElementNode[] = elementsOf(document()).filter(
      (element: ElementNode): boolean => element.type === "g",
    );

    expect(
      groups.map((group: ElementNode): unknown => propsOf(group).className),
    ).toEqual([ThemeVariant.dark, ThemeVariant.light]);
  });

  it("Embeds each layer as a self-contained image.", (): void => {
    const images: readonly ElementNode[] = flatten(document()).filter(
      (element: ElementNode): boolean => element.type === "image",
    );
    const first: ElementNode | undefined = images[0];
    const href: unknown = propsOf(first).href;

    expect(images).toHaveLength(Expected.images);
    expect(
      is.string(href) && href.startsWith("data:image/svg+xml;base64,"),
    ).toBe(true);
  });

  it("Nests a child scope's layer inside its parent's group.", (): void => {
    const theme: ElementNode = at(
      elementsOf(document()).filter(
        (element: ElementNode): boolean => element.type === "g",
      ),
      0,
    );
    const outer: ElementNode = at(elementsOf(theme), 1);
    const inner: ElementNode | undefined = elementsOf(outer).find(
      (element: ElementNode): boolean => element.type === "g",
    );

    expect(at(elementsOf(theme), 0).type).toBe("image");
    expect(styleOf(outer).animation).toContain("a-dark-0");
    expect(inner).toBeDefined();
    expect(styleOf(inner ?? outer).animation).toContain("a-dark-1");
  });
});
