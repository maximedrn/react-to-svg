import { Data } from "effect";

/**
 * Messages for {@link ResolveError}.
 */
const ResolveMessages = {
  expectedSingleRoot: (count: string): string =>
    `Expected the component to render exactly one root element, received ${count}.`,
  failed: "Failed to resolve the React tree.",
  threw: (cause: string): string =>
    `The component threw while rendering: ${cause}.`,
} as const;

/**
 * Raised when the component cannot be resolved to a host tree.
 */
class ResolveError extends Data.TaggedError("ResolveError")<{
  readonly cause: unknown;
  readonly message: string;
}> {}

export { ResolveError, ResolveMessages };
