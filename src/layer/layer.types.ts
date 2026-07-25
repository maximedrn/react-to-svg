import type { CSSProperties } from "react";
import type { AnimationScope } from "@/animate/animate.types.ts";
import type { ElementNode } from "@/resolve/resolve.types.ts";

interface Box {
  readonly height: number;
  readonly left: number;
  readonly top: number;
  readonly width: number;
}

/**
 * Boxes keyed by node identity — no indices, no ids, no string matching.
 */
type BoxMap = ReadonlyMap<ElementNode, Box>;

/**
 * One animated region of the tree, plus the scopes nested directly inside it.
 * The nesting is preserved so the composed document can nest the matching `<g>`
 * elements and let ancestor animations apply to their descendants.
 */
interface ScopeNode {
  readonly box: Box;
  readonly children: readonly ScopeNode[];
  readonly node: ElementNode;
  readonly scope: AnimationScope;
}

/**
 * A rasterized layer: opaque SVG bytes that are never inspected.
 */
interface Layer {
  readonly svg: string;
}

/**
 * A scope's animation compiled to CSS: a `@keyframes` rule (hoisted into the
 * document `<style>`) and the inline style that plays it.
 */
interface CompiledAnimation {
  readonly keyframes: string;
  readonly style: CSSProperties;
}

/**
 * One color state of a scope, rasterized on its own. A scope that animates a
 * color channel produces several of these and cross-fades between them, since a
 * bitmap layer cannot be recolored in place. `animation` (an opacity fade) is
 * attached by `compileAnimations`.
 */
interface CrossFadeLayer {
  readonly animation?: CompiledAnimation;
  readonly at: number;
  readonly layer: Layer;
}

interface LayerTree {
  readonly animation?: CompiledAnimation;
  readonly children: readonly LayerTree[];
  readonly crossFade?: readonly CrossFadeLayer[];
  readonly layer: Layer;
  readonly scope?: ScopeNode;
}

export type {
  Box,
  BoxMap,
  CompiledAnimation,
  CrossFadeLayer,
  Layer,
  LayerTree,
  ScopeNode,
};
