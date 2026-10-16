const SvgSyntax = {
  animation: "animation",
  attributes: {
    className: "class",
    fill: "fill",
    floodColor: "flood-color",
    height: "height",
    style: "style",
    viewBox: "viewBox",
    width: "width",
  },
  darkRules: /@media \(prefers-color-scheme: dark\)\{((?:[^{}]*\{[^}]*\})*)\}/,
  mimeType: "image/svg+xml",
  rule: /\.([\w-]+)\{([\w-]+):([^;}]+)\}/g,
  tags: { all: "*", flood: "feFlood", group: "g", style: "style", svg: "svg" },
  themes: ["dark", "light"],
  transparent: "transparent",
  whitespace: /\s+/,
} as const;

const SvgTestErrors = {
  attribute: (name: string): string => `Missing SVG attribute: ${name}.`,
  root: "Expected an SVG root element.",
  theme: (theme: string): string => `Missing SVG theme: ${theme}.`,
} as const;

export { SvgSyntax, SvgTestErrors };
