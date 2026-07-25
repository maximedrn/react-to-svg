import type { StyleObject } from "@/resolve/resolve.types.ts";

/**
 * Wrapper style a scope element uses so it lays out as a column and can host
 * children without adding a visible box of its own.
 */
const WrapperStyle: StyleObject = {
  display: "flex",
  flexDirection: "column",
};

/**
 * The common CSS timing functions, so an `Animation.easing` can be written as
 * `Easing.easeOut` instead of a bare string. `easing` stays a free `string`
 * though — any CSS `<easing-function>` (a `cubic-bezier(...)`, a `linear(...)`,
 * a `steps(...)`) is equally valid.
 */
const Easing = {
  ease: "ease",
  easeIn: "ease-in",
  easeInOut: "ease-in-out",
  easeOut: "ease-out",
  linear: "linear",
} as const;

export { Easing, WrapperStyle };
