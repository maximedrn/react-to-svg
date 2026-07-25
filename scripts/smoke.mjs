import {
  Animated,
  makeRenderService,
  useTimeline,
} from "@maximedrn/react-to-svg";

if (
  typeof makeRenderService !== "function" ||
  typeof useTimeline !== "function" ||
  Animated === undefined
) {
  throw new Error(
    "'@maximedrn/react-to-svg': expected public exports are missing.",
  );
}
