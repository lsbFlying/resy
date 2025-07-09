import type { AnyFn, PrimitiveState } from "../types";
import type { ComponentWithStore } from "../class-connect";

/**
 * @desc computed utils
 * TODO waiting developing
 */
export const computed = <T extends AnyFn, S extends PrimitiveState>(
  thisArg: ComponentWithStore<{}, S>,
  fn: T,
) => {
  if (__DEV__ && !thisArg.connectStore) {
    throw new Error("The this pointer must reference an instance inheriting from ComponentWithStore!");
  }
  return thisArg._store_.computed(fn) as ReturnType<T>;
};
