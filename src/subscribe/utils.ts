import type { PrimitiveState } from "../types";
import type { Store } from "../store/types";
import type { ListenerType } from "./types";
import { storeErrorProcessing } from "../store/errors";

export const subscribe = <S extends PrimitiveState>(
  store: Store<S>,
  listener: ListenerType<S>,
  stateKeys?: (keyof S)[],
  immediate?: boolean,
) => {
  storeErrorProcessing(store, "subscribe");
  store.subscribe(listener, stateKeys, immediate);
};
