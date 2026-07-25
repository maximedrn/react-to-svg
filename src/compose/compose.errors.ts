import { Data } from "effect";

/**
 * Messages for {@link ComposeError}.
 */
const ComposeMessages = {
  failed: "Failed to compose the animated document.",
  missingTheme: (theme: string): string =>
    `No layer tree was built for the '${theme}' theme.`,
} as const;

/**
 * Raised when the layers cannot be composed into the final document.
 */
class ComposeError extends Data.TaggedError("ComposeError")<{
  readonly cause: unknown;
  readonly message: string;
}> {}

export { ComposeError, ComposeMessages };
