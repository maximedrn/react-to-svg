import type { ReactNode } from "react";
import { type RenderableComponent, ThemeVariant } from "@/render.types.ts";
import { AutoStyle, BoxStyle, Layout } from "@/test/test.tailwind.constants.ts";

const AutoHeight: RenderableComponent = (props: {
  readonly theme: ThemeVariant;
}): ReactNode => (
  <div style={AutoStyle}>
    <div
      style={{
        ...BoxStyle,
        height:
          props.theme === ThemeVariant.light
            ? Layout.lightContentHeight
            : Layout.darkContentHeight,
        width: Layout.childWidth,
      }}
    />
  </div>
);

export { AutoHeight };
