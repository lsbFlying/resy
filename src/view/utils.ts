import type { PrimitiveState } from "../types";
import { hasOwnProperty, whatsType } from "../utils";
import { __DEV__ } from "../static";

// Scene handling of incorrect parameters of view
export const viewErrorHandle = (Comp: unknown, propsAreEqual?: unknown) => {
  const CompType = whatsType(Comp);
  const propsAreEqualType = whatsType(propsAreEqual);
  if (__DEV__ && CompType !== "Function") {
    throw new Error(
      `resy's view: The first argument must be a component. Instead received: ${CompType}`
    );
  }
  if (
    __DEV__ && (propsAreEqualType !== "Function" && propsAreEqualType !== "Undefined")
  ) {
    throw new Error(
      `resy's view: The second argument must be a object or undefined. Instead received: ${propsAreEqualType}`
    );
  }
};

/**
 * @description react`s shallowEqual major code
 */
export const equal = (objA: PrimitiveState, objB: PrimitiveState) => {
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return false;
  }

  // Test for A's keys different from B.
  for (let i = 0; i < keysA.length; i++) {
    const currentKey = keysA[i];
    if (
      !hasOwnProperty.call(objB, currentKey) ||
      // $FlowFixMe[incompatible-use] lost refinement of `objB`
      !Object.is(objA[currentKey], objB[currentKey])
    ) {
      return false;
    }
  }

  return true;
};
