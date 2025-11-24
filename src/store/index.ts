/**
 * created by liushanbao
 * @description An easy-to-use React state manager
 * @author liushanbao
 * @date 2022-05-05
 * @name createStore
 */
import type { StoreOptions, InitialState, Store } from "./types";
import type { PrimitiveState, ValueOf } from "../types";
import MetaStore from "./core";

/**
 * createStore
 * created by liushanbao
 * @description Create a state storage container that can be used globally
 * @author liushanbao
 * @date 2022-05-05
 * @param initialState
 * @param options
 * @return Store<S>
 * @suggestion Suggest using `definiteStore` !!!
 */
export const createStore = <S extends PrimitiveState>(
  initialState?: InitialState<S>,
  options?: StoreOptions,
) => {
  const ms = new MetaStore(initialState, options);
  const { _updater_ } = ms;
  return new Proxy(ms as any as Store<S>, {
    get: (_, key: keyof S) => {
      return !Reflect.has(ms, key)
        ? ms.store[key]
        : (ms as any as Store<S>)[key];
    },
    set: (_: S, key: keyof S, value: ValueOf<S>) => _updater_.updateMetaState(key, value),
    deleteProperty: (_: S, key: keyof S) => _updater_.updateMetaState(
      key, undefined as ValueOf<S>, true,
    ),
  } as ProxyHandler<Store<S>>) as Store<S>;
};
