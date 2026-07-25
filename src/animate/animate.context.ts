import { type Context, createContext } from "react";
import type { Timeline } from "@/animate/animate.types.ts";

/**
 * The timeline a subtree inherits when no scope has shifted it yet.
 */
const RootTimeline: Timeline = { beginMs: 0 };

/**
 * Propagates the accumulated start offset down the tree. Nesting two scopes
 * therefore adds their delays, which is what makes staggered and nested
 * animations compose without any coordination from the caller.
 */
const TimelineContext: Context<Timeline> =
  createContext<Timeline>(RootTimeline);

export { RootTimeline, TimelineContext };
