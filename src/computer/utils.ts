import type { Store } from "../store/types";
import type { AnyFn, PrimitiveState } from "../types";
import { storeErrorProcessing } from "../store/errors";

// computed utils
export const computed = <S extends PrimitiveState, T extends AnyFn>(
  store: Store<S>,
  fn: T,
) => {
  storeErrorProcessing(store, "useComputed");
  return store.computed(fn) as ReturnType<T>;
};
