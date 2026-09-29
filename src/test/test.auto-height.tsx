import type { ReactNode } from "react";
import { type RenderableComponent, ThemeVariant } from "@/render.types.ts";
import { Layout } from "@/test/test.tailwind.constants.ts";

const AutoHeight: RenderableComponent = (props: {
  readonly theme: ThemeVariant;
}): ReactNode => (
  <div style={{ display: "flex", flexDirection: "column", padding: 8 }}>
    <div
      style={{
        display: "flex",
        height:
          props.theme === ThemeVariant.light
            ? Layout.lightContentHeight
            : Layout.darkContentHeight,
        width: 20,
      }}
    />
  </div>
);

export { AutoHeight };
