import type {
  InitialState, InnerStoreOptions, Store, ClassicStore, MacroStore,
} from "./types";
import type { PrimitiveState } from "../types";
import { useState } from "react";
import { storeErrorProcessing } from "./errors";
import MetaStore from "./core";

/**
 * useStore api
 * @description useStore(store) === store.useStore()
 * @param store
 * @return ClassicStore<S>
 */
export const useStore = <S extends PrimitiveState>(
  store: Store<S>,
) => {
  storeErrorProcessing(store, "useStore");
  return store._$engineStore_ as ClassicStore<S>;
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
) => {
  const [ms] = useState(() => new MetaStore<S>(
    initialState,
    {
      _callerName_: "useConciseState",
    } as InnerStoreOptions
  ));
  return ms._$engineStore_ as MacroStore<S>;
};
