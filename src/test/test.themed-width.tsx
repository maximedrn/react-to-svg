import type { ReactNode } from "react";
import { type RenderableComponent, ThemeVariant } from "@/render.types.ts";
import { Layout } from "@/test/test.tailwind.constants.ts";

/**
 * A painted box whose width depends on the theme, so the two themes differ by
 * geometry and not only by colors.
 */
const ThemedWidth: RenderableComponent = (props: {
  readonly theme: ThemeVariant;
}): ReactNode => (
  <div style={{ display: "flex", padding: 8 }}>
    <div
      style={{
        backgroundColor: "#22c55e",
        display: "flex",
        height: 20,
        width:
          props.theme === ThemeVariant.light
            ? Layout.lightContentHeight
            : Layout.darkContentHeight,
      }}
    />
  </div>
);

export { ThemedWidth };
