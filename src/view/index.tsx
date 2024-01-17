import React, { type ComponentType } from "react";
import type { PrimitiveState } from "../types";
import { equal, viewErrorHandle } from "./handles";

const __view__ = Symbol("viewerKey");
const __props__ = Symbol("propsKey");

/**
 * view is equivalent to memo
 * @description "view" is used to optimize the rendering of components.
 * It has no mental burden of "hook rules" and "memo usage",
 * and its performance is more efficient than that of memo and useMemo.
 * 🌟 The implementation of features in a "view" must necessarily be simple or even clever.
 * If it requires an extremely complex implementation, the performance gains achieved may not be significant.
 */
export function view<P extends PrimitiveState>(
  Comp: ComponentType<P>,
  propsAreEqual?: (prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean,
): ComponentType<P> {
  viewErrorHandle(Comp, propsAreEqual);

  const Viewer: any = (props?: P) => {
    if (Viewer[__view__] && props) {
      return (propsAreEqual ?? equal)(Viewer[__props__], props)
        ? Viewer[__view__]
        : <Comp {...(props as P)} />;
    }
    if (Viewer[__view__]) return Viewer[__view__];

    props && (Viewer[__props__] = props);
    Viewer[__view__] = <Comp {...(props as any as P)} />;

    return Viewer[__view__];
  };

  return Viewer;
}
