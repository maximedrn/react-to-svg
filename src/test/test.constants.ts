import type { Box, Layer } from "@/layer/layer.types.ts";
import type { ElementNode } from "@/resolve/resolve.types.ts";

/**
 * Test fixture values, grouped so the suite references named keys instead of
 * bare numbers. Kept in one place because they recur across the fixtures and
 * the assertions that check them.
 */

/**
 * Delays and begins (ms) the animation and scope fixtures are built at.
 * `navStaggered*` and `shortDelayed` are the begins those delays compose to
 * once a `Stagger` step (120ms) or a `Delay` (300ms) is added.
 */
const Timing = {
  begin: 150,
  card: 400,
  headline: 250,
  nav: 100,
  navStaggered: 220,
  navStaggeredTwice: 340,
  short: 50,
  shortDelayed: 350,
} as const;

/**
 * Shape and style values the fixtures animate or assert.
 */
const Shape = {
  marginBottom: 8,
  panelScaleFrom: 0.92,
  scaleFrom: 0.9,
  slideDistance: 12,
} as const;

/**
 * Single-channel values the `compileScope` tests assert through `decl`.
 */
const Channel = {
  blur: 4,
  brightness: 1.5,
  perspective: 800,
  rotateX: 45,
  rotateY: -90,
  saturate: 1.4,
} as const;

/**
 * Results the timeline and document tests expect.
 */
const Expected = {
  delayBegins: [Timing.shortDelayed, 0],
  images: 6,
  panelBegins: [
    0,
    Timing.headline,
    Timing.nav,
    Timing.navStaggered,
    Timing.card,
  ],
  scopeCount: 4,
  staggerBegins: [Timing.nav, Timing.navStaggered, Timing.navStaggeredTwice],
} as const;

const Width = 200;
const Height = 120;
const Theme = ".dark { display: none; }";

/**
 * Satori only needs a font to shape text; a tree of sized boxes lays out
 * without one. Keeping the fixture text-free makes the suite self-contained: no
 * font file, no network, no snapshot to keep in sync.
 */
const Config = { fonts: [], height: Height, width: Width } as const;

const SampleBox: Box = { height: 20, left: 10, top: 30, width: 40 };

/**
 * The composer never inspects a layer, so an opaque sentinel is enough.
 */
const SampleLayer: Layer = { svg: "layer-bytes" };
const Source: ElementNode = { children: [], props: {}, type: "div" };

export {
  Channel,
  Config,
  Expected,
  Height,
  SampleBox,
  SampleLayer,
  Shape,
  Source,
  Theme,
  Timing,
  Width,
};
