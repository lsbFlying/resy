import type { Store } from "../store/types";
import type { AnyFn, PrimitiveState } from "../types";
import { storeErrorProcessing } from "../store/errors";

// computed hook
export const useComputed = <S extends PrimitiveState, T extends AnyFn>(
  store: Store<S>,
  fn: T,
) => {
  storeErrorProcessing(store, "useComputed");
  return store._computer_.useComputed(fn) as ReturnType<T>;
};
