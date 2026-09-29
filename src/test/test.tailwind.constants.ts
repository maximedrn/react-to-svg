import type { SatoriOptions } from "satori";

const LightConfig: SatoriOptions["tailwindConfig"] = {
  theme: {
    extend: {
      colors: { accent: "#ff0000" },
      spacing: { content: "24px", inset: "8px" },
    },
  },
};

const DarkConfig: SatoriOptions["tailwindConfig"] = {
  theme: {
    extend: {
      colors: { accent: "#0000ff" },
      spacing: { content: "24px", inset: "8px" },
    },
  },
};

const ReplacementConfig: SatoriOptions["tailwindConfig"] = {
  theme: {
    extend: {
      colors: { accent: "#00ff00" },
      spacing: { content: "32px", inset: "8px" },
    },
  },
};

const Layout = {
  classNameHeight: 48,
  darkContentHeight: 12,
  legacyHeight: 16,
  lightContentHeight: 25,
  wrapperHeight: 32,
} as const;

const TestErrors = {
  configuration: "Failed to resolve the test configuration.",
} as const;

export { DarkConfig, Layout, LightConfig, ReplacementConfig, TestErrors };
