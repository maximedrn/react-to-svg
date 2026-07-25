import { createContext } from "react";
import { DefaultEventPriority } from "react-reconciler/constants.js";
import { TextNodeType } from "@/render.constants.ts";
import { Reconciler } from "@/resolve/resolve.constants.ts";
import type { NodeProps } from "@/resolve/resolve.types.ts";

/**
 * Mutable counterpart of `ResolvedNode`. The reconciler needs to append, insert
 * and remove children in place; the tree is frozen into its readonly shape by
 * `resolve.renderer.ts` once the commit is done.
 */
interface MutableElement {
  children: MutableNode[];
  props: NodeProps;
  readonly type: string;
}

/**
 * Mutable counterpart of `TextNode`.
 */
interface MutableText {
  text: string;
  readonly type: typeof TextNodeType;
}

/**
 * Either kind of node the reconciler builds while committing.
 */
type MutableNode = MutableElement | MutableText;

/**
 * The render target the reconciler mounts into.
 */
interface Container {
  children: MutableNode[];
}

/**
 * Does nothing; the shape react-reconciler expects for unused callbacks.
 */
const noop: () => void = (): void => undefined;

/**
 * Removes a child from a list in place, if present.
 *
 * @param {MutableNode[]} children - The list to mutate.
 * @param {MutableNode} child - The child to remove.
 *
 * @returns {void}
 */
const detach: (children: MutableNode[], child: MutableNode) => void = (
  children: MutableNode[],
  child: MutableNode,
): void => {
  const index: number = children.indexOf(child);
  if (index !== -1) children.splice(index, 1);
};

/**
 * Inserts a child before a sibling, or at the end when the sibling is gone.
 *
 * @param {MutableNode[]} children - The list to mutate.
 * @param {MutableNode} child - The child to insert.
 * @param {MutableNode} before - The sibling to insert in front of.
 *
 * @returns {void}
 */
const insertAt: (
  children: MutableNode[],
  child: MutableNode,
  before: MutableNode,
) => void = (
  children: MutableNode[],
  child: MutableNode,
  before: MutableNode,
): void => {
  const index: number = children.indexOf(before);
  children.splice(index === -1 ? children.length : index, 0, child);
};

/**
 * Host config for a "tree building" renderer. No DOM, no side effects: every
 * callback either mutates the plain tree or is a no-op. React itself runs the
 * function components, which is what makes hooks and context work.
 *
 * `react-reconciler` ships no types, so its contract is an untyped external
 * surface (`Record<string, unknown>`); every callback is nonetheless typed
 * inline, and the ambient `resolve.d.ts` types the three methods the resolver
 * actually calls back.
 */
const hostConfig: Readonly<Record<string, unknown>> = {
  afterActiveInstanceBlur: noop,
  appendChild: (parent: MutableElement, child: MutableNode): void => {
    parent.children.push(child);
  },
  appendChildToContainer: (parent: Container, child: MutableNode): void => {
    parent.children.push(child);
  },
  appendInitialChild: (parent: MutableElement, child: MutableNode): void => {
    parent.children.push(child);
  },
  beforeActiveInstanceBlur: noop,
  bindToConsole:
    (_method: unknown, args: readonly unknown[]) => (): readonly unknown[] =>
      args,
  cancelTimeout: clearTimeout,
  clearContainer: (container: Container): void => {
    container.children.length = 0;
  },
  commitTextUpdate: (
    instance: MutableText,
    _old: string,
    next: string,
  ): void => {
    instance.text = next;
  },
  commitUpdate: (
    instance: MutableElement,
    _type: string,
    _oldProps: NodeProps,
    nextProps: NodeProps,
  ): void => {
    instance.props = nextProps;
  },
  createInstance: (type: string, props: NodeProps): MutableElement => ({
    children: [],
    props,
    type,
  }),
  createTextInstance: (text: string): MutableText => ({
    text,
    type: TextNodeType,
  }),
  detachDeletedInstance: noop,
  finalizeInitialChildren: (): boolean => false,
  getChildHostContext: (parent: object): object => parent,
  getCurrentUpdatePriority: (): number => DefaultEventPriority,
  getInstanceFromNode: (): null => null,
  getInstanceFromScope: (): null => null,
  getPublicInstance: (instance: MutableNode): MutableNode => instance,
  getRootHostContext: (): object => ({}),
  HostTransitionContext: createContext(null),
  insertBefore: (
    parent: MutableElement,
    child: MutableNode,
    before: MutableNode,
  ): void => {
    insertAt(parent.children, child, before);
  },
  insertInContainerBefore: (
    parent: Container,
    child: MutableNode,
    before: MutableNode,
  ): void => {
    insertAt(parent.children, child, before);
  },
  isPrimaryRenderer: false,
  maySuspendCommit: (): boolean => false,
  NotPendingTransition: null,
  noTimeout: -1 as const,
  preloadInstance: (): boolean => true,
  prepareForCommit: (): null => null,
  preparePortalMount: noop,
  prepareScopeUpdate: noop,
  removeChild: (parent: MutableElement, child: MutableNode): void => {
    detach(parent.children, child);
  },
  removeChildFromContainer: (parent: Container, child: MutableNode): void => {
    detach(parent.children, child);
  },
  requestPostPaintCallback: noop,
  resetAfterCommit: noop,
  resetFormInstance: noop,
  resolveEventTimeStamp: (): number => Reconciler.noEventTimeStamp,
  resolveEventType: (): null => null,
  resolveUpdatePriority: (): number => DefaultEventPriority,
  scheduleTimeout: setTimeout,
  setCurrentUpdatePriority: noop,
  shouldAttemptEagerTransition: (): boolean => false,
  shouldSetTextContent: (): boolean => false,
  startSuspendingCommit: noop,
  supportsHydration: false,
  supportsMutation: true,
  supportsPersistence: false,
  suspendInstance: noop,
  trackSchedulerEvent: noop,
  waitForCommitToBeReady: (): null => null,
};

export type { Container, MutableElement, MutableNode, MutableText };
export { hostConfig };
