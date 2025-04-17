import type { MapType, PrimitiveState, ValueOf } from "../types";
import type {
  ProxyableType, CreateProxyType,
  MapPrototypeProxyableValueType, KeyChainsSourceItemType,
} from "./types";
import type { Store } from "../store/types";
import { proxyable } from "./utils";

/** ============ Proxy factory for map prototype chain proxyable functions start ============ */
export const applyTargetGetFactory = <S extends PrimitiveState>(
  _storeProxyWeakMap: WeakMap<object, Store<S>>,
  applyOriginFunction: MapPrototypeProxyableValueType,
  _thisArg: MapType<S>,
  parentTarget: MapType<S>,
  createProxy: CreateProxyType<S>,
  firstLevelKey?: keyof S,
  keyChains?: Set<KeyChainsSourceItemType<S>>,
) => {
  return (key: keyof S): ValueOf<S> | undefined => {
    const value = parentTarget.get(key);
    return proxyable(value)
      ? createProxy(
        value as ProxyableType<S>,
        parentTarget,
        firstLevelKey,
        new Set(keyChains).add({ key }),
        applyOriginFunction,
      ) as ValueOf<S>
      : value;
  };
};
/** ============ Proxy factory for map prototype chain proxyable functions end ============ */
