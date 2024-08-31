import type { ConciseStore, ConciseStoreCore, InitialState, InnerStoreOptions, Store } from "./types";
import type { PrimitiveState } from "../types";
import { useMemo } from "react";
import { __USE_STORE_KEY__ } from "./static";
import { storeErrorProcessing } from "./errors";
import { createStore } from "./index";

/**
 * useStore api
 * @description useStore(store) === store.useStore()
 * @param store
 * @return store
 */
export const useStore = <S extends PrimitiveState>(store: Store<S> | ConciseStoreCore<S>): S => {
  storeErrorProcessing(store, "useStore");
  return store[__USE_STORE_KEY__ as keyof S];
};

/**
 * A concise version of useState
 * @description The functionality of useConciseState is not limited to just a concise syntax on the surface.
 * Its deeper capability is to deconstruct the store and provide sub-components with a doorway
 * that allows for comprehensive control over the store's data, rendering, updates, and subscriptions.
 * @example:
 * const { count, text, setState } = useConciseState({ count: 0, text: "hello" });
 * equivalent to:
 * const [count, setCount] = useState(0);
 * const [text, setText] = useState("hello");
 * 🌟 useConciseState is relatively simple and clear to use compared to useState when dealing with multiple data states.
 * 🌟 Furthermore, within useConciseState, the store attribute can be parsed out, and through the store,
 * the latest data values of various items can be accessed,
 * compensating for the shortfall in useState where the latest values of attribute data cannot be retrieved.
 * @param initialState
 * @return ConciseStore<S>
 */
export const useConciseState = <S extends PrimitiveState>(
  initialState?: InitialState<S>,
): ConciseStore<S> => {
  return useMemo(() => {
    return createStore<S>(
      initialState,
      { __useConciseState__: true } as InnerStoreOptions,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])[__USE_STORE_KEY__ as keyof S];
};
