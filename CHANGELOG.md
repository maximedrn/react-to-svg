# @maximedrn/react-to-svg

## 0.2.0

- Support React `className` for Tailwind styling on host elements, `Animated`, and `Stagger`, with precedence over the legacy `tw` prop.
- Reset Tailwind shadows and gradients on ancestors of animated layers when styled through `className`.
- Allow `height` to be omitted and derive a shared viewport from the light theme's intrinsic height.
- Accept a shared or per-theme `tailwindConfig` for both measurement and rasterization.
- Report invalid automatic heights and failing Tailwind configuration factories through the typed Effect error channel.
- Pin Satori to `0.28.2` and include the required Tailwind cache patch. Applications must apply the patch at their own package-manager root; see the README.
