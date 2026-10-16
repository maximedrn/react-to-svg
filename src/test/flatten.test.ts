import { describe, expect, it } from "bun:test";
import type { Element } from "@xmldom/xmldom";
import { elementsOf } from "@/flatten/flatten.dom.ts";
import { flattenLayer } from "@/flatten/flatten.layer.ts";
import { Flatten, Layers } from "@/test/test.flatten.constants.ts";

const count: (root: Element, tag: string) => number = (
  root: Element,
  tag: string,
): number => elementsOf(root, tag).length;

describe("'flattenLayer'.", (): void => {
  it("Removes the invisible paint Satori emits, and keeps the rest.", (): void => {
    const root: Element = flattenLayer(Layers.invisible, Flatten.prefix);

    expect(count(root, "filter")).toBe(1);
    expect(count(root, "mask")).toBe(0);
    expect(count(root, "pattern")).toBe(0);
    expect(count(root, "linearGradient")).toBe(0);
    expect(count(root, "rect")).toBe(1);
    expect(count(root, "g")).toBe(0);
  });

  it("Keeps the elements of a layer whose stylesheet may paint them.", (): void => {
    const root: Element = flattenLayer(Layers.styled, Flatten.prefix);

    expect(count(root, "rect")).toBe(1);
  });

  it("Inlines an embedded icon as a nested viewport.", (): void => {
    const root: Element = flattenLayer(Layers.icon, Flatten.prefix);
    const [viewport] = elementsOf(root, "svg");

    expect(count(root, "image")).toBe(0);
    expect(count(root, "clipPath")).toBe(0);
    expect(count(root, "mask")).toBe(0);
    expect(viewport?.parentNode).toBe(root);
    expect(viewport?.getAttribute("x")).toBe("20");
    expect(viewport?.getAttribute("width")).toBe("20");
    expect(viewport?.getAttribute("viewBox")).toBe("0 0 2 2");
    expect(viewport?.getAttribute("preserveAspectRatio")).toBe("none");
    expect(viewport?.hasAttribute("tw")).toBe(false);
  });

  it("Keeps a clip path that does more than the icon's own viewport.", (): void => {
    const root: Element = flattenLayer(Layers.unclipped, Flatten.prefix);
    const [viewport] = elementsOf(root, "svg");
    const group: Element | null | undefined = viewport?.parentElement;

    expect(count(root, "clipPath")).toBe(1);
    expect(group?.localName).toBe("g");
    expect(group?.getAttribute("clip-path")).toContain(Flatten.prefix);
  });

  it("Leaves an icon that carries a stylesheet embedded.", (): void => {
    const root: Element = flattenLayer(Layers.nonPortable, Flatten.prefix);

    expect(count(root, "image")).toBe(1);
  });

  it("Renumbers every id under the layer prefix, references included.", (): void => {
    const root: Element = flattenLayer(Layers.unclipped, Flatten.prefix);
    const ids: readonly string[] = elementsOf(root)
      .map((element: Element): string => element.getAttribute("id") ?? "")
      .filter((id: string): boolean => id.length > 0);
    const references: readonly string[] = elementsOf(root).flatMap(
      (element: Element): string[] =>
        Array.from(element.attributes).flatMap((attribute): string[] =>
          Array.from(
            attribute.value.matchAll(Flatten.reference),
            (match: RegExpExecArray): string => match[1] ?? "",
          ),
        ),
    );

    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) expect(id.startsWith(Flatten.prefix)).toBe(true);
    for (const reference of references) expect(ids).toContain(reference);
  });
});
