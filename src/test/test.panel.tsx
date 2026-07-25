import { createElement, type FC, type ReactNode } from "react";
import { Animated } from "@/animate/animate.animated.tsx";
import { Stagger } from "@/animate/animate.stagger.tsx";
import { ThemeVariant } from "@/render.types.ts";
import { resolveTree } from "@/resolve/resolve.renderer.ts";
import type { ElementNode } from "@/resolve/resolve.types.ts";
import { fade, scale, slide } from "@/test/test.animations.ts";
import { Shape, Timing } from "@/test/test.constants.ts";

interface PanelProps {
  readonly theme: ThemeVariant;
}

/**
 * A small nested tree of sized boxes wrapped in the animation scope components,
 * shared by every test that needs a realistic resolved tree to walk.
 */
const Panel: FC<PanelProps> = (props: PanelProps): ReactNode => (
  <div
    style={{
      background: props.theme === ThemeVariant.dark ? "#0b1120" : "#f8fafc",
      display: "flex",
      flexDirection: "column",
      height: "100%",
      padding: 8,
      width: "100%",
    }}
  >
    <div
      style={{ background: "#94a3b8", display: "flex", height: 12, width: 60 }}
    />

    <Animated animation={slide(Shape.slideDistance)}>
      <div
        style={{
          background: "#6366f1",
          display: "flex",
          height: 20,
          width: 40,
        }}
      />
      <Animated animation={fade(Timing.headline)}>
        <div
          style={{
            background: "#ec4899",
            display: "flex",
            height: 10,
            width: 10,
          }}
        />
      </Animated>
    </Animated>

    <Stagger
      animation={fade(Timing.nav)}
      stepMs={120}
    >
      <div
        style={{ background: "#22c55e", display: "flex", height: 8, width: 8 }}
      />
      <div
        style={{ background: "#22c55e", display: "flex", height: 8, width: 8 }}
      />
    </Stagger>

    <Animated animation={scale(Timing.card, Shape.panelScaleFrom)}>
      <div
        style={{
          background: "#f59e0b",
          display: "flex",
          height: 14,
          width: 14,
        }}
      />
    </Animated>
  </div>
);

const resolvePanel: () => ElementNode = (): ElementNode =>
  resolveTree(createElement(Panel, { theme: ThemeVariant.light }));

// biome-ignore lint/style/useComponentExportOnlyModules: resolvePanel is the fixture's paired resolver, shared across the test files.
export { Panel, resolvePanel };
