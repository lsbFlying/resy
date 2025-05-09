import type { InitialState, InnerStoreOptions, Store, MacroStore, ClassicStore } from "./types";
import type { PrimitiveState } from "../types";
import { useMemo } from "react";
import { storeErrorProcessing } from "./errors";
import StoreCore from "./store";

/**
 * useStore api
 * @description useStore(store) === store.useStore()
 * @param store
 * @return store
 */
export const useStore = <S extends PrimitiveState>(
  store: Store<S>,
): ClassicStore<S> => {
  storeErrorProcessing(store, "useStore");
  return store.engineStore;
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
 * @return MacroStore<S>
 */
export const useConciseState = <S extends PrimitiveState>(
  initialState?: InitialState<S>,
): MacroStore<S> => {
  return useMemo(() => {
    return (
      new StoreCore<S>(
        initialState,
        {
          __useConciseState__: true,
          __functionName__: useConciseState.name,
        } as InnerStoreOptions
      )
    ).engineStore;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
