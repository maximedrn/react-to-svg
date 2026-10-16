import type { ReactNode } from "react";
import type { RenderableComponent } from "@/render.types.ts";
import { BoxStyle, Classes } from "@/test/test.tailwind.constants.ts";

const TailwindPanel: RenderableComponent = (): ReactNode => (
  <div
    className={Classes.panel}
    style={BoxStyle}
  >
    <div
      className={Classes.content}
      style={BoxStyle}
    />
  </div>
);

export { TailwindPanel };
