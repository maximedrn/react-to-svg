import { Schema } from "effect";
import { TextNodeType } from "@/render.constants.ts";

/**
 * Style object accepted by Satori. Values stay untyped on purpose: Satori
 * supports a CSS subset that is wider than `React.CSSProperties` in places
 * (`tw`-resolved values) and narrower in others.
 */
type StyleObject = Readonly<Record<string, unknown>>;

/**
 * Props carried by a resolved element: an arbitrary bag plus a few knowns.
 */
interface NodeProps extends Readonly<Record<string, unknown>> {
  readonly className?: string;
  readonly style?: StyleObject;
  readonly tw?: string;
}

/**
 * A resolved host element: a `type`, its `props` and its resolved children.
 */
interface ElementNode {
  readonly children: readonly ResolvedNode[];
  readonly props: NodeProps;
  readonly type: string;
}

/**
 * A resolved text run.
 */
interface TextNode {
  readonly text: string;
  readonly type: typeof TextNodeType;
}

/**
 * Either kind of node produced by the resolver.
 */
type ResolvedNode = ElementNode | TextNode;

/**
 * Schema describing a {@link TextNode}, used to derive its type guard.
 */
const TextNodeSchema = Schema.Struct({
  text: Schema.String,
  type: Schema.Literal(TextNodeType),
});

const matchesTextNode: (node: unknown) => boolean = Schema.is(TextNodeSchema);

/**
 * Narrows a resolved node to a text run, validating its shape with `Schema`
 * rather than probing keys by hand.
 *
 * A type predicate must annotate its narrowing on the function itself, so this
 * is one of the few signatures that keeps a return annotation.
 *
 * @param {ResolvedNode} node - The node to test.
 *
 * @returns {boolean} `true` when `node` is a {@link TextNode}.
 */
const isTextNode = (node: ResolvedNode): node is TextNode =>
  matchesTextNode(node);

/**
 * Narrows a resolved node to an element.
 *
 * @param {ResolvedNode} node - The node to test.
 *
 * @returns {boolean} `true` when `node` is an {@link ElementNode}.
 */
const isElementNode = (node: ResolvedNode): node is ElementNode =>
  !isTextNode(node);

export type { ElementNode, NodeProps, ResolvedNode, StyleObject, TextNode };
export { isElementNode, isTextNode };
