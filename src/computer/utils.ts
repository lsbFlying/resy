import type { AnyFn, PrimitiveState } from "../types";
import type { ComponentWithStore } from "../class-connect";
import { __RESY_CWS_BRAND__ } from "../class-connect/static";

/**
 * @desc computed utils
 * TODO waiting developing
 */
export const computed = <T extends AnyFn, S extends PrimitiveState>(
  thisArg: ComponentWithStore<{}, S>,
  fn: T,
) => {
  if (__DEV__ && !thisArg[__RESY_CWS_BRAND__]) {
    throw new Error("The this pointer must reference an instance inheriting from ComponentWithStore!");
  }
  return thisArg._$store_._computer_.computed(fn) as ReturnType<T>;
};
