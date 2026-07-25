import is from "@sindresorhus/is";
import { Schema } from "effect";
import type { AnimationScope } from "@/animate/animate.types.ts";
import type { NodeProps } from "@/resolve/resolve.types.ts";

/**
 * Prop key carrying an `AnimationScope`. Satori ignores unknown props for
 * layout but forwards them verbatim to `onNodeDetected`, so this doubles as the
 * identity channel between the React tree and the measured boxes.
 */
const ScopeProp = "data-animation-scope";

/**
 * Schema describing an {@link AnimationScope}'s shape, used to derive its type
 * guard. Kept structural — the value comes from our own components, so the
 * nested animation only needs to be an object, not a fully validated one.
 */
const AnimationScopeSchema = Schema.Struct({
  animation: Schema.Object,
  beginMs: Schema.Number,
});

const matchesScope: (value: unknown) => boolean =
  Schema.is(AnimationScopeSchema);

/**
 * Type guard for a value read back from {@link ScopeProp}, validated with
 * `Schema` rather than probing keys by hand.
 *
 * A type predicate must annotate its narrowing, so this keeps a return type. It
 * also replaces the previous cast: the value arrives as `unknown` and is
 * checked structurally before it is trusted as an {@link AnimationScope}.
 *
 * @param {unknown} value - The raw prop value.
 *
 * @returns {boolean} `true` when `value` has an animation scope's shape.
 */
const isAnimationScope = (value: unknown): value is AnimationScope =>
  matchesScope(value);

/**
 * Reads the animation scope a node carries, if any.
 *
 * @param {NodeProps} props - The node's props.
 *
 * @returns {AnimationScope | undefined} The scope, or `undefined` when absent.
 */
const readScope: (props: NodeProps) => AnimationScope | undefined = (
  props: NodeProps,
): AnimationScope | undefined => {
  const value: unknown = props[ScopeProp];
  if (isAnimationScope(value)) return value;
};

/**
 * Whether a node carries an animation scope.
 *
 * @param {NodeProps} props - The node's props.
 *
 * @returns {boolean} `true` when a scope is present.
 */
const hasScope: (props: NodeProps) => boolean = (props: NodeProps): boolean =>
  !is.undefined(readScope(props));

export { hasScope, readScope, ScopeProp };
