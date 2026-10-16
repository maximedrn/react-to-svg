import type { CSSProperties, HTMLAttributes } from "react";
import type { SatoriOptions } from "satori";
import { Config, Width } from "@/test/test.constants.ts";

const Palette = {
  content: "#ff00ff",
  dark: "#0000ff",
  light: "#ff0000",
  replacement: "#00ff00",
} as const;
const Spacing = { content: "24px", inset: "8px", replacement: "32px" } as const;
const SharedSpacing = {
  content: Spacing.content,
  inset: Spacing.inset,
} as const;

const LightConfig: SatoriOptions["tailwindConfig"] = {
  theme: {
    extend: { colors: { accent: Palette.light }, spacing: SharedSpacing },
  },
};
const DarkConfig: SatoriOptions["tailwindConfig"] = {
  theme: {
    extend: { colors: { accent: Palette.dark }, spacing: SharedSpacing },
  },
};
const ReplacementConfig: SatoriOptions["tailwindConfig"] = {
  theme: {
    extend: {
      colors: { accent: Palette.replacement },
      spacing: { ...SharedSpacing, content: Spacing.replacement },
    },
  },
};

const Layout = {
  childWidth: 20,
  darkContentHeight: 12,
  delayMs: 0,
  inset: 8,
  lightContentHeight: 25,
  stepMs: 100,
} as const;
const BoxStyle: CSSProperties = { display: "flex" };
const AutoStyle: CSSProperties = {
  ...BoxStyle,
  flexDirection: "column",
  padding: Layout.inset,
};
const ChildStyle: CSSProperties = {
  ...BoxStyle,
  height: Layout.inset,
  width: Layout.inset,
};
const PaintedChildStyle: CSSProperties = {
  ...ChildStyle,
  backgroundColor: Palette.content,
};
const InlineStyle: CSSProperties = {
  ...BoxStyle,
  height: Layout.darkContentHeight,
};

const Classes = {
  animated: "p-[4px]",
  content: "flex h-content w-content",
  empty: "",
  legacy: "flex h-[16px]",
  panel: "flex flex-col bg-accent p-inset",
  preferred: "flex h-[48px]",
  shadow: "flex shadow-lg",
  stagger: "p-[8px]",
} as const;

const AutoConfig = { fonts: Config.fonts, width: Width } as const;

// Hand-checked outcomes. Do not derive these through renderer helpers or
// production constants: fixture inputs and the output oracle are separate.
const ExpectedLayout = {
  automaticHeight: 41,
  classNameHeight: 48,
  emptyHeight: 0,
  inlineHeight: 12,
  legacyHeight: 16,
  replacementHeight: 48,
  sharedHeight: 40,
  wrapperHeight: 32,
} as const;

const ExpectedDocument = {
  animatedLayerCount: 2,
  baseLayerCount: 1,
  origin: [0, 0],
  themeCount: 2,
} as const;
const TestErrors = {
  configuration: "Failed to resolve the test configuration.",
} as const;

const Cases = {
  automatic: "Uses the light theme's intrinsic height for the shared viewport.",
  className: "Uses className ahead of the legacy tw prop for layout.",
  concurrent: "Isolates configurations across concurrent render requests.",
  emptyClassName: "An empty className suppresses legacy tw styling.",
  emptyLayout: "Fails empty automatic layouts through the typed error channel.",
  explicit: "Keeps an explicitly supplied viewport height.",
  factoryAuto:
    "Preserves a configuration failure during automatic measurement.",
  factoryFixed: "Preserves a configuration failure with a fixed viewport.",
  inline: "Keeps inline styles ahead of Tailwind declarations.",
  legacy: "Keeps legacy tw layout working without className.",
  replacement: "Uses replacement colors and spacing in subsequent renders.",
  shadow:
    "Keeps ancestor shadows in the base layer and content in its animated layer.",
  shared: "Uses a shared configuration for both layout and painting.",
  suite: "Render options through Effect.",
  themes: "Paints each theme with its own Tailwind configuration.",
  wrappers: "Lays out className padding on Animated and Stagger wrappers.",
} as const;

const LayoutCases: readonly {
  readonly height: number;
  readonly name: string;
  readonly props: HTMLAttributes<HTMLDivElement>;
}[] = [
  {
    height: ExpectedLayout.classNameHeight,
    name: Cases.className,
    props: { className: Classes.preferred, tw: Classes.legacy },
  },
  {
    height: ExpectedLayout.legacyHeight,
    name: Cases.legacy,
    props: { tw: Classes.legacy },
  },
  {
    height: ExpectedLayout.emptyHeight,
    name: Cases.emptyClassName,
    props: { className: Classes.empty, style: BoxStyle, tw: Classes.legacy },
  },
  {
    height: ExpectedLayout.inlineHeight,
    name: Cases.inline,
    props: { className: Classes.preferred, style: InlineStyle },
  },
];

const FailureCases = [
  { name: Cases.factoryAuto, options: AutoConfig },
  { name: Cases.factoryFixed, options: Config },
] as const;

export {
  AutoConfig,
  AutoStyle,
  BoxStyle,
  Cases,
  ChildStyle,
  Classes,
  DarkConfig,
  ExpectedDocument,
  ExpectedLayout,
  FailureCases,
  Layout,
  LayoutCases,
  LightConfig,
  PaintedChildStyle,
  Palette,
  ReplacementConfig,
  TestErrors,
};
