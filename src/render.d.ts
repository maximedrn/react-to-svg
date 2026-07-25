/**
 * Satori accepts a `tw` prop on every host element it renders; React's own
 * types do not know about it. Declaring it here keeps `tw` type-safe in the
 * components handed to the renderer.
 */
declare namespace React {
  interface HTMLAttributes<T> {
    readonly tw?: string | undefined;
  }
}

declare module "*.css" {
  const content: string;

  export default content;
}
