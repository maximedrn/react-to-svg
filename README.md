# react-to-svg

Turn a React component into a single animated, theme-aware SVG string - powered by [Satori](https://github.com/vercel/satori) and [Effect](https://effect.website).

## Install

```bash
# NPM
npm i react-to-svg

# PNPM
pnpm add react-to-svg

# Yarn
yarn add react-to-svg

# Bun
bun add react-to-svg

# Deno
deno add npm:react-to-svg
```

## Usage

```tsx
import { readFile, writeFile } from "node:fs/promises";
import { Effect } from "effect";
import {
  Animated,
  Easing,
  type IRenderService,
  type RenderableComponent,
  RenderService,
  RenderServiceLive,
  ThemeVariant,
} from "react-to-svg";

interface CardProps {
  theme: ThemeVariant;
}

const Card: RenderableComponent = (props: CardProps) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      padding: 24,
    }}
  >
    <Animated
      animation={{
        delayMs: 0,
        durationMs: 500,
        easing: Easing.easeOut,
        keyframes: [
          {
            at: 0,
            opacity: 0,
            translateY: 16,
          },
          {
            at: 1,
            opacity: 1,
            translateY: 0,
          },
        ],
        perspective: 800,
        repeat: 0,
      }}
    >
      <div
        style={{
          color: props.theme === ThemeVariant.dark ? "#fff" : "#000",
        }}
      >
        Hello
      </div>
    </Animated>
  </div>
);

const program: Effect.Effect<void, Error, RenderService> = Effect.gen(
  function* () {
    const render: IRenderService = yield* RenderService;
    const svg: string = yield* render.renderSVG(Card, {
      fonts: [
        {
          data: yield* Effect.promise(async (): Promise<ArrayBuffer> => {
            const buffer: Buffer<ArrayBuffer> = await readFile("Inter.ttf");
            return buffer.buffer.slice(
              buffer.byteOffset,
              buffer.byteOffset + buffer.byteLength,
            );
          }),
          name: "Inter",
        },
      ],
      height: 260,
      width: 420,
    });
    yield* Effect.promise((): Promise<void> => writeFile("card.svg", svg));
  },
);

await Effect.runPromise(Effect.provide(program, RenderServiceLive));
```
