import { defineConfig, type Options } from "tsup";

type MaybePromise<T> = T | Promise<T>;

const config:
  | Options
  | Options[]
  | ((overrideOptions: Options) => MaybePromise<Options | Options[]>) =
  defineConfig({
    clean: true,
    dts: true,
    entry: ["src/index.ts"],
    format: ["esm"],
    loader: { ".css": "text" },
    onSuccess: "cp src/render.theme.css dist/render.theme.css",
    sourcemap: true,
    target: "node20",
    treeshake: true,
  });

export default config;
