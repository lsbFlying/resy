import type { PrimitiveState } from "../types";
import type { ListenerType } from "./types";
import type { Store } from "../store/types";
import { storeErrorProcessing } from "../store/errors";

/** @description Hook of subscribe */
export const useSubscription = <S extends PrimitiveState>(
  store: Store<S>,
  listener: ListenerType<S>,
  stateKeys?: (keyof S)[],
  immediate?: boolean,
) => {
  storeErrorProcessing(store, "useSubscription");
  store.useSubscription(listener, stateKeys, immediate);
};
