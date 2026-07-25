import is from "@sindresorhus/is";
import type { ReactNode } from "react";
import createReconciler, {
  type Reconciler,
  type ReconcilerRoot,
} from "react-reconciler";
import { BoxElement, TextNodeType } from "@/render.constants.ts";
import { ResolveError, ResolveMessages } from "@/resolve/resolve.errors.ts";
import {
  type Container,
  hostConfig,
  type MutableNode,
} from "@/resolve/resolve.host.ts";
import {
  type ElementNode,
  isElementNode,
  isTextNode,
  type ResolvedNode,
} from "@/resolve/resolve.types.ts";

const reconciler: Reconciler = createReconciler(hostConfig);

const TextWrapperStyle = { display: "flex" } as const;

/**
 * Wraps a text run in an explicit element.
 *
 * Satori lays out a bare string as an anonymous box we cannot address. Giving
 * every text run an explicit element makes each layout participant measurable,
 * which is what lets the projection step replace it by a pinned placeholder.
 * Verified layout-neutral: a single text child is left untouched, because
 * Satori already treats that node as the text element itself.
 *
 * @param {string} text - The text run to wrap.
 *
 * @returns {ElementNode} A flex box whose only child is the text.
 */
const wrapText: (text: string) => ElementNode = (
  text: string,
): ElementNode => ({
  children: [{ text, type: TextNodeType }],
  props: { style: TextWrapperStyle },
  type: BoxElement,
});

/**
 * Freezes a mutable node into its readonly resolved shape.
 *
 * @param {MutableNode} node - The mutable node produced by the reconciler.
 * @param {number} siblingCount - How many siblings the node has, so a lone text
 *   child can be left unwrapped.
 *
 * @returns {ResolvedNode} The frozen node.
 */
const freeze: (node: MutableNode, siblingCount: number) => ResolvedNode = (
  node: MutableNode,
  siblingCount: number,
): ResolvedNode => {
  if (isTextNode(node)) {
    const text: string = node.text;
    return siblingCount > 1 ? wrapText(text) : { text, type: TextNodeType };
  }
  return {
    children: node.children.map((child: MutableNode): ResolvedNode =>
      freeze(child, node.children.length),
    ),
    props: node.props,
    type: node.type,
  };
};

/**
 * Runs `element` through a dedicated React renderer and returns the resulting
 * host tree. Because React itself performs the render, hooks, context,
 * `useMemo`, `Suspense`-free boundaries and component composition all behave
 * exactly as they would in any other renderer.
 *
 * @param {ReactNode} element - The React element to resolve.
 *
 * @returns {ElementNode} The single root element the component rendered.
 */
const resolveTree: (element: ReactNode) => ElementNode = (
  element: ReactNode,
): ElementNode => {
  const container: Container = { children: [] };
  const failures: Error[] = [];
  const capture: (error: unknown) => void = (error: unknown): void => {
    failures.push(error instanceof Error ? error : new Error(String(error)));
  };
  const root: ReconcilerRoot = reconciler.createContainer(
    container,
    0,
    null,
    false,
    null,
    "",
    capture,
    capture,
    capture,
    (): void => undefined,
  );

  reconciler.updateContainerSync(element, root, null, null);
  reconciler.flushSyncWork();

  const failure: Error | undefined = failures[0];

  if (!is.undefined(failure)) {
    throw new ResolveError({
      cause: failure,
      message: ResolveMessages.threw(failure.message),
    });
  }

  const roots: ResolvedNode[] = container.children.map(
    (child: MutableNode): ResolvedNode =>
      freeze(child, container.children.length),
  );
  const only: ResolvedNode | undefined = roots[0];

  if (roots.length !== 1 || is.undefined(only) || !isElementNode(only)) {
    throw new ResolveError({
      cause: undefined,
      message: ResolveMessages.expectedSingleRoot(String(roots.length)),
    });
  }

  return only;
};

export { resolveTree };
