import React from "react";
import type { ComponentType, JSX } from "react";
import type { PrimitiveState } from "../types";
import { hasOwnProperty } from "../utils";
import { pureViewErrorHandle } from "../errors";

const elementRefCacheKey = Symbol("elementRefCacheKey");
const propsKey = Symbol("__props__");

type ComponentProType = ComponentType & { [elementRefCacheKey]: JSX.Element };

/**
 * @description react`s shallowEqual major code
 */
function equal(objA: PrimitiveState, objB: PrimitiveState) {
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;

  // Test for A's keys different from B
  for (let i = 0; i < keysA.length; i++) {
    const currentKey = keysA[i];
    if (!hasOwnProperty.call(objB, currentKey) || !Object.is(objA[currentKey], objB[currentKey])) {
      return false;
    }
  }

  return true;
}

/**
 * @description "pureView" is used to optimize the rendering of components.
 * It has no mental burden of "hook rules" and "memo usage",
 * and its performance is more efficient than that of memo and useMemo.
 * 🌟 The implementation of features in a "pureView" must necessarily be simple or even clever.
 * If it requires an extremely complex implementation, the performance gains achieved may not be significant.
 */
export function pureView<P extends PrimitiveState>(
  Comp: ComponentType<P>,
  props?: P,
  propsAreEqual?: (prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean,
): JSX.Element {
  pureViewErrorHandle(Comp, props);
  if ((Comp as ComponentProType)[elementRefCacheKey] && props) {
    return (propsAreEqual ?? equal)(pureView.prototype[propsKey], props)
      ? (Comp as ComponentProType)[elementRefCacheKey]
      : <Comp {...(props as P)} />;
  }
  if ((Comp as ComponentProType)[elementRefCacheKey]) return (Comp as ComponentProType)[elementRefCacheKey];
  props && (pureView.prototype[propsKey] = props);
  (Comp as ComponentProType)[elementRefCacheKey] = <Comp {...(props as P)} />;
  return (Comp as ComponentProType)[elementRefCacheKey];
}
