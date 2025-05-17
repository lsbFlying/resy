/**
 * created by liushanbao
 * @description An easy-to-use React state manager
 * @author liushanbao
 * @date 2022-05-05
 * @name createStore
 */
import type { StoreOptions, InitialState } from "./types";
import type { PrimitiveState } from "../types";
import StoreMeta from "./store";

/**
 * createStore
 * created by liushanbao
 * @description Create a state storage container that can be used globally
 * @author liushanbao
 * @date 2022-05-05
 * @param initialState
 * @param options
 * @return Store<S>
 */
export const createStore = <S extends PrimitiveState>(
  initialState?: InitialState<S>,
  options?: StoreOptions,
) => {
  const storeMeta = new StoreMeta(initialState, options);
  console.log(storeMeta);
  return storeMeta.store;
};
