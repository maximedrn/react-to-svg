import is from "@sindresorhus/is";
import satori, { type SatoriNode } from "satori";
import { readScope } from "@/animate/animate.scope.ts";
import type { AnimationScope } from "@/animate/animate.types.ts";
import { toSatoriElement } from "@/layer/layer.element.ts";
import { MeasureError, MeasureMessages } from "@/layer/layer.errors.ts";
import type { SatoriConfig } from "@/layer/layer.raster.ts";
import type { Box, BoxMap, ScopeNode } from "@/layer/layer.types.ts";
import { NodeTokenProp } from "@/render.constants.ts";
import {
  type ElementNode,
  isElementNode,
  type ResolvedNode,
} from "@/resolve/resolve.types.ts";

/**
 * The geometry Satori reported, plus the scope hierarchy it revealed.
 */
interface Measurement {
  readonly boxes: BoxMap;
  readonly scopes: readonly ScopeNode[];
}

/**
 * Tags every element with a token whose _reference_ identifies it. Satori
 * copies props into `onNodeDetected`, so the token comes back untouched and
 * each measured box can be attributed without relying on traversal order.
 *
 * @param {ResolvedNode} node - The node to tag.
 * @param {Map<object, ElementNode>} tokens - Registry mapping each fresh token
 *   to its source element.
 *
 * @returns {ResolvedNode} The node with a token added to every element.
 */
const tokenize: (
  node: ResolvedNode,
  tokens: Map<object, ElementNode>,
) => ResolvedNode = (
  node: ResolvedNode,
  tokens: Map<object, ElementNode>,
): ResolvedNode => {
  if (!isElementNode(node)) return node;
  const token: object = {};
  tokens.set(token, node);

  return {
    children: node.children.map((child: ResolvedNode): ResolvedNode =>
      tokenize(child, tokens),
    ),
    props: { ...node.props, [NodeTokenProp]: token },
    type: node.type,
  };
};

/**
 * Rebuilds the scope hierarchy, mirroring how scopes nest in the tree.
 *
 * @param {ResolvedNode} node - The node to walk.
 * @param {BoxMap} boxes - The measured geometry, keyed by element identity.
 *
 * @returns {readonly ScopeNode[]} The scopes found in this subtree, nested.
 */
const collectScopes: (
  node: ResolvedNode,
  boxes: BoxMap,
) => readonly ScopeNode[] = (
  node: ResolvedNode,
  boxes: BoxMap,
): readonly ScopeNode[] => {
  if (!isElementNode(node)) return [];
  const nested: readonly ScopeNode[] = node.children.flatMap(
    (child: ResolvedNode): readonly ScopeNode[] => collectScopes(child, boxes),
  );
  const scope: AnimationScope | undefined = readScope(node.props);

  if (is.undefined(scope)) return nested;
  const box: Box | undefined = boxes.get(node);

  if (is.undefined(box)) {
    throw new MeasureError({
      cause: undefined,
      message: MeasureMessages.scopeNotReached,
    });
  }
  return [{ box, children: nested, node, scope }];
};

/**
 * Measures the tree with Satori, reading each box back through the token it
 * carries, then derives the scope hierarchy from the same tree.
 *
 * @param {ElementNode} root - The resolved tree to measure.
 * @param {SatoriConfig} config - Fonts and viewport Satori needs to lay out.
 *
 * @returns {Promise<Measurement>} The boxes and the scope hierarchy.
 */
const measureTree: (
  root: ElementNode,
  config: SatoriConfig,
) => Promise<Measurement> = async (
  root: ElementNode,
  config: SatoriConfig,
): Promise<Measurement> => {
  const tokens: Map<object, ElementNode> = new Map();
  const tagged: ResolvedNode = tokenize(root, tokens);
  const boxes: Map<ElementNode, Box> = new Map();

  await satori(toSatoriElement(tagged), {
    fonts: [...config.fonts],
    height: config.height,
    onNodeDetected: (detected: SatoriNode): void => {
      const token: unknown = detected.props[NodeTokenProp];
      const source: ElementNode | undefined = is.object(token)
        ? tokens.get(token)
        : undefined;

      if (!is.undefined(source)) {
        boxes.set(source, {
          height: detected.height,
          left: detected.left,
          top: detected.top,
          width: detected.width,
        });
      }
    },
    width: config.width,
  });

  return { boxes, scopes: collectScopes(root, boxes) };
};

export type { Measurement };
export { measureTree };
