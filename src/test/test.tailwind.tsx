import type { ReactNode } from "react";
import type { RenderableComponent } from "@/render.types.ts";

const TailwindPanel: RenderableComponent = (): ReactNode => (
  <div
    className="flex flex-col bg-accent p-inset"
    style={{ display: "flex" }}
  >
    <div
      className="flex h-content w-content"
      style={{ display: "flex" }}
    />
  </div>
);

export { TailwindPanel };
