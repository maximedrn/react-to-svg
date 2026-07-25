import { Card } from "@example/example.card.tsx";
import { Effect } from "effect";
import {
  type FontConfig,
  FontStyle,
  FontWeight,
  makeRenderService,
  type RenderError,
} from "@/index.ts";

/**
 * Run with `bun start` (or `bun run example/example.main.ts`).
 *
 * Satori shapes text itself, so it needs real font bytes: the demo ships Inter
 * (regular + bold) as static `.otf`, which Satori reads directly.
 */
const Family: string = "Inter";
const OutputPath: string = "example.svg";
const Width: number = 1200;
const Height: number = 630;

const Faces = [
  {
    path: `${import.meta.dir}/assets/fonts/Inter-Regular.otf`,
    weight: FontWeight._400,
  },
  {
    path: `${import.meta.dir}/assets/fonts/Inter-Bold.otf`,
    weight: FontWeight._700,
  },
] as const;

/**
 * Reads one font file into a `FontConfig`; `Bun.file(...).arrayBuffer()` yields
 * the bytes directly.
 *
 * @param {(typeof Faces)[number]} face - The font face to load.
 *
 * @returns {Effect.Effect<FontConfig, Error>} The loaded font config.
 */
const loadFont: (
  face: (typeof Faces)[number],
) => Effect.Effect<FontConfig, Error> = (
  face: (typeof Faces)[number],
): Effect.Effect<FontConfig, Error> =>
  Effect.tryPromise({
    catch: (cause: unknown): Error =>
      new Error(`Failed to read font ${face.path}`, { cause }),
    try: async (): Promise<FontConfig> => ({
      data: await Bun.file(face.path).arrayBuffer(),
      name: Family,
      style: FontStyle.normal,
      weight: face.weight,
    }),
  });

const program: Effect.Effect<void, Error | RenderError> = Effect.gen(
  function* () {
    const fonts: readonly FontConfig[] = yield* Effect.forEach(Faces, loadFont);

    const svg: string = yield* makeRenderService().renderSVG(Card, {
      fonts,
      height: Height,
      width: Width,
    });
    yield* Effect.promise((): Promise<number> => Bun.write(OutputPath, svg));
    yield* Effect.log(`Wrote ${OutputPath}`);
  },
);

await Effect.runPromise(program);

export { program };
