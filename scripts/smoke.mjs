import { Animated, makeRenderService, useTimeline } from "react-to-svg";

if (
  typeof makeRenderService !== "function" ||
  typeof useTimeline !== "function" ||
  Animated === undefined
) {
  throw new Error("'react-to-svg': expected public exports are missing.");
}
