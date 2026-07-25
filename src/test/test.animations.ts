import { Easing } from "@/animate/animate.constants.ts";
import type { Animation } from "@/animate/animate.types.ts";

/**
 * A fade `Animation` at a given delay — the delay is all the timeline tests
 * assert on, so the rest of the timing is fixed.
 *
 * @param {number} delayMs - The delay to set.
 *
 * @returns {Animation} An opacity `0 → 1` animation at that delay.
 */
const fade: (delayMs: number) => Animation = (delayMs: number): Animation => ({
  delayMs,
  durationMs: 400,
  easing: Easing.easeOut,
  keyframes: [
    { at: 0, opacity: 0 },
    { at: 1, opacity: 1 },
  ],
  perspective: 800,
  repeat: 0,
});

/**
 * A slide-up `Animation` over a given distance.
 *
 * @param {number} distance - The travel distance, in pixels.
 *
 * @returns {Animation} A `translateY` + fade animation.
 */
const slide: (distance: number) => Animation = (
  distance: number,
): Animation => ({
  delayMs: 0,
  durationMs: 400,
  easing: Easing.easeOut,
  keyframes: [
    { at: 0, opacity: 0, translateY: distance },
    { at: 1, opacity: 1, translateY: 0 },
  ],
  perspective: 800,
  repeat: 0,
});

/**
 * A scale-in `Animation` from a given scale, at a given delay.
 *
 * @param {number} delayMs - The delay to set.
 * @param {number} from - The starting scale.
 *
 * @returns {Animation} A `scale` + fade animation.
 */
const scale: (delayMs: number, from: number) => Animation = (
  delayMs: number,
  from: number,
): Animation => ({
  delayMs,
  durationMs: 400,
  easing: Easing.easeOut,
  keyframes: [
    { at: 0, opacity: 0, scale: from },
    { at: 1, opacity: 1, scale: 1 },
  ],
  perspective: 800,
  repeat: 0,
});

/**
 * A `backgroundColor` tween, the fixture the cross-fade path is built on.
 *
 * @param {string} from - The starting color.
 * @param {string} to - The ending color.
 *
 * @returns {Animation} A two-stop color animation.
 */
const colorAnimation: (from: string, to: string) => Animation = (
  from: string,
  to: string,
): Animation => ({
  delayMs: 0,
  durationMs: 300,
  easing: Easing.linear,
  keyframes: [
    { at: 0, backgroundColor: from },
    { at: 1, backgroundColor: to },
  ],
  perspective: 800,
  repeat: 0,
});

export { colorAnimation, fade, scale, slide };
