import type { ReactNode } from "react";
import { Animated } from "@/animate/animate.animated.tsx";
import type { RenderableComponent } from "@/render.types.ts";
import { fade } from "@/test/test.animations.ts";
import {
  BoxStyle,
  Classes,
  Layout,
  PaintedChildStyle,
} from "@/test/test.tailwind.constants.ts";

const ShadowPanel: RenderableComponent = (): ReactNode => (
  <div
    className={Classes.shadow}
    style={BoxStyle}
  >
    <Animated animation={fade(Layout.delayMs)}>
      <div style={PaintedChildStyle} />
    </Animated>
  </div>
);

export { ShadowPanel };
