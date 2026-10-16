import { describe, expect, it } from "bun:test";
import { Effect } from "effect";
import type { FC, ReactNode } from "react";
import { Animated } from "@/animate/animate.animated.tsx";
import { renderDocument } from "@/render.pipeline.ts";
import type { ThemeVariant } from "@/render.types.ts";
import { colorAnimation } from "@/test/test.animations.ts";
import { Config, Theme } from "@/test/test.constants.ts";
import { Panel } from "@/test/test.panel.tsx";
import { ThemedWidth } from "@/test/test.themed-width.tsx";

describe("'renderDocument'.", (): void => {
  it("Produces a single flat animated document for both themes.", async (): Promise<void> => {
    const markup: string = await Effect.runPromise(
      renderDocument(Panel, Config, Theme),
    );

    expect(markup.startsWith("<svg")).toBe(true);
    expect(markup.endsWith("</svg>")).toBe(true);
    expect(markup.includes("<image")).toBe(false);
    expect(markup.includes("<filter")).toBe(false);
    expect(markup.includes("@keyframes")).toBe(true);
  });

  it("Draws themes that only differ by colors once, with themed classes.", async (): Promise<void> => {
    const markup: string = await Effect.runPromise(
      renderDocument(Panel, Config, Theme),
    );

    expect(markup.includes('class="dark"')).toBe(false);
    expect(markup.includes(Theme)).toBe(false);
    expect(markup).toContain(".t0{fill:#f8fafc}");
    expect(markup).toContain(
      "@media (prefers-color-scheme: dark){.t0{fill:#0b1120}}",
    );
    expect(markup).toContain('class="t0"');
  });

  it("Keeps one group per theme when their drawings differ.", async (): Promise<void> => {
    const markup: string = await Effect.runPromise(
      renderDocument(ThemedWidth, Config, Theme),
    );

    expect(markup).toContain('class="dark"');
    expect(markup).toContain('class="light"');
    expect(markup.includes(Theme)).toBe(true);
  });

  it("Cross-fades a color-animated scope across stacked rasters.", async (): Promise<void> => {
    const Swatch: FC<{ readonly theme: ThemeVariant }> = (): ReactNode => (
      <div style={{ display: "flex", height: "100%", width: "100%" }}>
        <Animated animation={colorAnimation("#ff0000", "#0000ff")}>
          <div style={{ display: "flex", height: 20, width: 20 }} />
        </Animated>
      </div>
    );

    const markup: string = await Effect.runPromise(
      renderDocument(Swatch, Config, Theme),
    );

    expect(markup.includes("@keyframes a-0-c1")).toBe(true);
    expect(markup.includes("a-dark-")).toBe(false);
  });

  it("Reports a component failure as a typed 'ResolveError'.", async (): Promise<void> => {
    const Boom: FC<{ readonly theme: ThemeVariant }> = (): ReactNode => {
      throw new Error("render failed");
    };
    const outcome = await Effect.runPromise(
      Effect.either(renderDocument(Boom, Config, Theme)),
    );

    expect(outcome._tag).toBe("Left");
    expect(outcome._tag === "Left" ? outcome.left._tag : undefined).toBe(
      "ResolveError",
    );
  });
});
