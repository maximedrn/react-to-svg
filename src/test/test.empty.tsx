import type { ReactNode } from "react";
import type { RenderableComponent } from "@/render.types.ts";
import { BoxStyle } from "@/test/test.tailwind.constants.ts";

const Empty: RenderableComponent = (): ReactNode => <div style={BoxStyle} />;

export { Empty };
