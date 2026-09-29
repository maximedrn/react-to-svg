import is from "@sindresorhus/is";
import { hasScope } from "@/animate/animate.scope.ts";
import type { Box, BoxMap, ScopeNode } from "@/layer/layer.types.ts";
import {
  ExpensivePaintKeys,
  PaintReset,
  PaintResetExpensive,
} from "@/render.constants.ts";
import {
  type ElementNode,
  isElementNode,
  type ResolvedNode,
  type StyleObject,
} from "@/resolve/resolve.types.ts";

/**
 * Collapses a node to an invisible box of exactly its measured size.
 *
 * `opacity: 0` is used rather than a paint reset because it neutralizes
 * everything a node can paint — including whatever `tw` contributed — while
 * leaving the box untouched. Satori's box model is border-box, so pinning
 * `width`/`height` to the measured values reproduces the original layout.
 *
 * @param {ElementNode} node - The element to collapse.
 * @param {Box} box - Its measured geometry.
 *
 * @returns {ElementNode} A childless, invisible box of the measured size.
 */
const pin: (node: ElementNode, box: Box) => ElementNode = (
  node: ElementNode,
  box: Box,
): ElementNode => ({
  children: [],
  props: {
    ...node.props,
    style: {
      ...node.props.style,
      flexGrow: 0,
      flexShrink: 0,
      height: box.height,
      opacity: 0,
      width: box.width,
    },
  },
  type: node.type,
});

/**
 * Whether a node needs the expensive paint resets (gradients, shadows,
 * filters).
 *
 * @param {ElementNode} node - The element to inspect.
 *
 * @returns {boolean} `true` when a Tailwind class or an expensive style is
 *   present.
 */
const needsExpensiveReset: (node: ElementNode) => boolean = (
  node: ElementNode,
): boolean => {
  const classes: string | undefined = node.props.className ?? node.props.tw;
  if (is.string(classes) && classes.length > 0) {
    return true;
  }
  const style: StyleObject = node.props.style ?? {};
  return ExpensivePaintKeys.some((key: string): boolean => key in style);
};

/**
 * Keeps a node's geometry and inheritable text style while removing everything
 * it paints. Applied to the ancestors of a scope so that a scope layer carries
 * only its own pixels: the ancestors' background stays in the base layer, where
 * it does not move with the animation.
 *
 * @param {ElementNode} node - The ancestor element to strip.
 *
 * @returns {StyleObject} The node's style with paint neutralized.
 */
const unPaint: (node: ElementNode) => StyleObject = (
  node: ElementNode,
): StyleObject => ({
  ...node.props.style,
  ...PaintReset,
  ...(needsExpensiveReset(node) ? PaintResetExpensive : {}),
});

/**
 * Looks up a node's measured box, falling back to a zero box.
 *
 * @param {ElementNode} node - The element to look up.
 * @param {BoxMap} boxes - The measured geometry, keyed by element identity.
 *
 * @returns {Box} The measured box, or a zero box when the node was not
 *   measured.
 */
const requireBox: (node: ElementNode, boxes: BoxMap) => Box = (
  node: ElementNode,
  boxes: BoxMap,
): Box => {
  const box: Box | undefined = boxes.get(node);
  return box ?? { height: 0, left: 0, top: 0, width: 0 };
};

/**
 * The static layer: the whole tree, with every animated scope reduced to an
 * invisible placeholder of the right size.
 *
 * @param {ElementNode} root - The resolved tree.
 * @param {BoxMap} boxes - The measured geometry, keyed by element identity.
 *
 * @returns {ElementNode} The base layer tree.
 */
const projectBase: (root: ElementNode, boxes: BoxMap) => ElementNode = (
  root: ElementNode,
  boxes: BoxMap,
): ElementNode => {
  const walk: (node: ElementNode) => ElementNode = (
    node: ElementNode,
  ): ElementNode => {
    if (hasScope(node.props)) return pin(node, requireBox(node, boxes));
    return {
      ...node,
      children: node.children.map((child: ResolvedNode): ResolvedNode =>
        isElementNode(child) ? walk(child) : child,
      ),
    };
  };
  return walk(root);
};

/**
 * Collects the chain of elements from `root` down to `target`, inclusive.
 *
 * @param {ResolvedNode} node - The node currently being searched.
 * @param {ElementNode} target - The element to reach.
 * @param {readonly ElementNode[]} trail - The elements walked so far.
 *
 * @returns {readonly ElementNode[] | undefined} The path, or `undefined` when
 *   `target` is not under `node`.
 */
const collectPath: (
  node: ResolvedNode,
  target: ElementNode,
  trail: readonly ElementNode[],
) => readonly ElementNode[] | undefined = (
  node: ResolvedNode,
  target: ElementNode,
  trail: readonly ElementNode[],
): readonly ElementNode[] | undefined => {
  if (!isElementNode(node)) return;
  const next: readonly ElementNode[] = [...trail, node];

  if (node === target) return next;
  for (const child of node.children) {
    const found: readonly ElementNode[] | undefined = collectPath(
      child,
      target,
      next,
    );
    if (!is.undefined(found)) return found;
  }
};

/**
 * The layer for one animated scope: the scope's own subtree in its original
 * position, with its ancestors kept for layout and inheritance but stripped of
 * paint, everything else collapsed, and directly nested scopes pinned out —
 * they get their own layer, nested inside this one in the composed document.
 *
 * @param {ElementNode} root - The resolved tree.
 * @param {ScopeNode} scope - The scope this layer isolates.
 * @param {BoxMap} boxes - The measured geometry, keyed by element identity.
 * @param {Readonly<Record<string, string>>} colors - Color overrides applied to
 *   the scope element, producing one cross-fade variant.
 *
 * @returns {ElementNode} The scope layer tree.
 */
const projectScope: (
  root: ElementNode,
  scope: ScopeNode,
  boxes: BoxMap,
  colors?: Readonly<Record<string, string>>,
) => ElementNode = (
  root: ElementNode,
  scope: ScopeNode,
  boxes: BoxMap,
  colors?: Readonly<Record<string, string>>,
): ElementNode => {
  const path: readonly ElementNode[] = collectPath(root, scope.node, []) ?? [
    root,
  ];
  const ancestors: ReadonlySet<ElementNode> = new Set(path.slice(0, -1));

  const keepSubtree: (node: ElementNode) => ElementNode = (
    node: ElementNode,
  ): ElementNode => {
    if (node !== scope.node && hasScope(node.props)) {
      return pin(node, requireBox(node, boxes));
    }
    return {
      ...node,
      children: node.children.map((child: ResolvedNode): ResolvedNode =>
        isElementNode(child) ? keepSubtree(child) : child,
      ),
    };
  };

  const walk: (node: ElementNode) => ElementNode = (
    node: ElementNode,
  ): ElementNode => {
    if (node === scope.node) {
      const subtree: ElementNode = keepSubtree(node);
      return {
        ...subtree,
        props: {
          ...subtree.props,
          style: { ...subtree.props.style, ...colors },
        },
      };
    }
    if (ancestors.has(node)) {
      return {
        children: node.children.map((child: ResolvedNode): ResolvedNode =>
          isElementNode(child) ? walk(child) : child,
        ),
        props: { ...node.props, style: unPaint(node) },
        type: node.type,
      };
    }
    return pin(node, requireBox(node, boxes));
  };

  return walk(root);
};

export { pin, projectBase, projectScope };
