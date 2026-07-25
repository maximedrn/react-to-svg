import is from "@sindresorhus/is";
import { readScope } from "@/animate/animate.scope.ts";
import type { AnimationScope } from "@/animate/animate.types.ts";
import {
  type ElementNode,
  isElementNode,
  type ResolvedNode,
} from "@/resolve/resolve.types.ts";

/**
 * A view over a resolved element's style, typed so assertions can read the
 * inspected properties with dot access instead of an index signature.
 */
interface StyleView {
  readonly animation?: unknown;
  readonly backgroundColor?: unknown;
  readonly marginBottom?: unknown;
  readonly opacity?: unknown;
  readonly width?: unknown;
}

/**
 * A view over a resolved element's props, typed for the same reason. `tw` is
 * shared with `NodeProps` so the assignment is not a weak type.
 */
interface PropsView {
  readonly className?: unknown;
  readonly href?: unknown;
  readonly tw?: unknown;
  readonly viewBox?: unknown;
}

/**
 * A view over a color stop's colors, typed for the same reason.
 */
interface ColorsView {
  readonly backgroundColor?: string;
}

const elementsOf: (node: ElementNode) => readonly ElementNode[] = (
  node: ElementNode,
): readonly ElementNode[] => node.children.filter(isElementNode);

const at: (nodes: readonly ElementNode[], index: number) => ElementNode = (
  nodes: readonly ElementNode[],
  index: number,
): ElementNode => {
  const node: ElementNode | undefined = nodes[index];

  if (is.undefined(node)) {
    throw new Error(`Expected an element at index ${String(index)}`);
  }
  return node;
};

/**
 * Every element in the subtree, parents before children.
 */
const flatten: (node: ResolvedNode) => readonly ElementNode[] = (
  node: ResolvedNode,
): readonly ElementNode[] =>
  isElementNode(node) ? [node, ...node.children.flatMap(flatten)] : [];

const scopesOf: (node: ResolvedNode) => readonly AnimationScope[] = (
  node: ResolvedNode,
): readonly AnimationScope[] =>
  flatten(node)
    .map((element: ElementNode): AnimationScope | undefined =>
      readScope(element.props),
    )
    .filter(
      (scope: AnimationScope | undefined): scope is AnimationScope =>
        !is.undefined(scope),
    );

const styleOf: (node: ElementNode) => StyleView = (
  node: ElementNode,
): StyleView => node.props.style ?? {};

const propsOf: (node: ElementNode | undefined) => PropsView = (
  node: ElementNode | undefined,
): PropsView => node?.props ?? {};

const colorsOf: (
  colors: Readonly<Record<string, string>> | undefined,
) => ColorsView = (
  colors: Readonly<Record<string, string>> | undefined,
): ColorsView => colors ?? {};

export { at, colorsOf, elementsOf, flatten, propsOf, scopesOf, styleOf };
