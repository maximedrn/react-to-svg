import { Text } from "@example/example.constants.ts";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Animated,
  Easing,
  type RenderableComponent,
  ThemeVariant,
} from "@/index.ts";

/**
 * A small logo drawn as inline SVG and embedded as a data URI, so the demo
 * stays self-contained with no external image to fetch.
 */
const Logo: string = `data:image/svg+xml;utf8,${encodeURIComponent(
  renderToStaticMarkup(
    <svg
      height="96"
      width="96"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{Text.logo}</title>
      <rect
        fill="#6366f1"
        height="96"
        rx="24"
        width="96"
      />
      <path
        d="M30 66 L48 30 L66 66 Z"
        fill="#f8fafc"
      />
    </svg>,
  ),
)}`;

/**
 * The demo: a spinning logo above a word-mark that slides in, on a theme-aware
 * background, set in Inter.
 *
 * @param {{ readonly theme: ThemeVariant }} props - The theme to render for.
 *
 * @returns {ReactNode} The card.
 */
const Card: RenderableComponent = (props: {
  readonly theme: ThemeVariant;
}): ReactNode => (
  <div
    style={{
      alignItems: "center",
      background: props.theme === ThemeVariant.dark ? "#0b1120" : "#f8fafc",
      display: "flex",
      flexDirection: "column",
      fontFamily: "Inter",
      gap: 28,
      height: "100%",
      justifyContent: "center",
      width: "100%",
    }}
  >
    <Animated
      animation={{
        delayMs: 0,
        durationMs: 4000,
        easing: Easing.linear,
        keyframes: [
          { at: 0, rotate: 0 },
          { at: 1, rotate: 360 },
        ],
        perspective: 800,
        repeat: Number.POSITIVE_INFINITY,
      }}
    >
      <img
        alt={Text.logo}
        height={96}
        src={Logo}
        width={96}
      />
    </Animated>

    <Animated
      animation={{
        delayMs: 200,
        durationMs: 600,
        easing: Easing.easeOut,
        keyframes: [
          { at: 0, opacity: 0, translateY: 24 },
          { at: 1, opacity: 1, translateY: 0 },
        ],
        perspective: 800,
        repeat: 0,
      }}
    >
      <div
        style={{
          color: props.theme === ThemeVariant.dark ? "#f1f5f9" : "#0f172a",
          display: "flex",
          fontSize: 52,
          fontWeight: 700,
        }}
      >
        {Text.wordMark}
      </div>
    </Animated>
  </div>
);

export { Card };
