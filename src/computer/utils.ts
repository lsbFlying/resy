import type { Store } from "../store/types";
import type { AnyFn, PrimitiveState } from "../types";
import { storeErrorProcessing } from "../store/errors";

/**
 * @desc computed utils
 * TODO waiting developing
 */
export const computed = <S extends PrimitiveState, T extends AnyFn>(
  store: Store<S>,
  fn: T,
) => {
  storeErrorProcessing(store, "useComputed");
  return store.computed(fn) as ReturnType<T>;
};
