import type { ReactElement, ReactNode } from "react";
import { isTextNode, type ResolvedNode } from "@/resolve/resolve.types.ts";

/**
 * Turns a resolved node into something Satori can lay out.
 *
 * Satori accepts "React-element-like" objects — `{ type, props, key }` — which
 * is exactly what the resolved tree already is, and what {@link ReactElement}
 * structurally describes, so no cast is needed. It must stay a _plain_ object:
 * building a real element with `createElement` makes Satori route it through
 * React's renderer, which clashes with the reconciler's dispatcher and throws
 * "Invalid hook call". A plain object is walked structurally instead, so Satori
 * never runs a component — hooks and context were dealt with by the resolver.
 *
 * @param {ResolvedNode} node - The resolved node to convert.
 *
 * @returns {ReactNode} A text string, or an element-like object for Satori.
 */
const toSatoriElement: (node: ResolvedNode) => ReactNode = (
  node: ResolvedNode,
): ReactNode => {
  if (isTextNode(node)) return node.text;
  const element: ReactElement = {
    key: null,
    props: {
      ...node.props,
      children: node.children.map(toSatoriElement),
    },
    type: node.type,
  };
  return element;
};

export { toSatoriElement };
