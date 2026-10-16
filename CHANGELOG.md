# @maximedrn/react-to-svg

## 0.3.0

- Draw every layer inline in a single flat document instead of embedding each one as a base64 `<image>`, so browsers parse one document and optimizers see every element.
- Draw both themes once when they only differ by colors or opacities: the differing values become classes switched by `prefers-color-scheme`. Themes that differ by geometry or motion keep their two toggled groups.
- Remove the invisible patterns, masks and filters emitted to reset the paint of animated layers' ancestors, together with every resource left unreferenced; they rendered nothing yet cost an offscreen pass on each animation frame.
- Inline the inline `<svg>` children Satori embeds as data-URI images, such as icons, as nested viewports, dropping their redundant clip paths and masks.
- Add `@xmldom/xmldom` as a dependency to parse and flatten Satori's output.

## 0.2.0

- Support React `className` for Tailwind styling on host elements, `Animated`, and `Stagger`, with precedence over the legacy `tw` prop.
- Reset Tailwind shadows and gradients on ancestors of animated layers when styled through `className`.
- Allow `height` to be omitted and derive a shared viewport from the light theme's intrinsic height.
- Accept a shared or per-theme `tailwindConfig` for both measurement and rasterization.
- Report invalid automatic heights and failing Tailwind configuration factories through the typed Effect error channel.
- Pin Satori to `0.28.2` and include the required Tailwind cache patch. Applications must apply the patch at their own package-manager root; see the README.
