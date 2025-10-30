import type { AnyFn, PrimitiveState } from "../types";
import type { ComponentWithStore } from "../class-connect";
import { _RESY_CWS_BRAND_ } from "../class-connect/static";

/**
 * @desc computed utils
 * TODO waiting developing
 */
export const computed = <T extends AnyFn, S extends PrimitiveState>(
  thisArg: ComponentWithStore<{}, S>,
  fn: T,
) => {
  if (__DEV__ && !thisArg[_RESY_CWS_BRAND_]) {
    throw new Error("The this pointer must reference an instance inheriting from ComponentWithStore!");
  }
  return thisArg._$store_.computed(fn) as ReturnType<T>;
};
