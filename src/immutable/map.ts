/**
 * @description prototype method proxies for map.
 */

import type { MapType, PrimitiveState, ValueOf } from "../types";
import {
  ProxyableType, CreateProxyType, MapPrototypeProxyableValueType,
  KeyChainsSourceItemType, ArrayPrototypeProxyableValueType, MapPrototypeProxyableFactoryType, MapWithGrandparentKeyType,
} from "./types";
import type { Store } from "../store/types";
import { proxyable } from "./utils";
import { __GRANDPARENT_KEY__ } from "./static";

export const applyGetFactory = <S extends PrimitiveState>(
  _storeProxyWeakMap: WeakMap<object, Store<S>>,
  applyOriginFunction: MapPrototypeProxyableValueType,
  _thisArg: MapWithGrandparentKeyType<S>,
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
        // TODO 这里父节点可能不对
        parentTarget,
        firstLevelKey,
        new Set(keyChains).add({ key }),
        // TODO map has get problem
        // keyChains?.add({ key }),
        applyOriginFunction,
      ) as ValueOf<S>
      : value;
  };
};

export const applyClearFactory: MapPrototypeProxyableFactoryType = <S extends PrimitiveState>(
  _storeProxyWeakMap: WeakMap<object, Store<S>>,
  applyOriginFunction: MapPrototypeProxyableValueType,
  thisArg: MapWithGrandparentKeyType<S>,
  _parentTarget: MapType<S>,
  _createProxy: CreateProxyType<S>,
  firstLevelKey?: keyof S,
  keyChains?: Set<KeyChainsSourceItemType<S>>,
  singleUpdate?: (
    key: keyof S,
    value: ValueOf<S>,
    isDelete: boolean,
    target: object | S,
    firstLevelKey?: keyof S,
    keyChains?: Set<KeyChainsSourceItemType<S>>,
    applyOriginFunction?: ArrayPrototypeProxyableValueType,
  ) => boolean,
) => {
  return () => {
    const curKey = Array.from(keyChains!).at(-1)?.key;
    singleUpdate?.(
      curKey!,
      new Map() as ValueOf<S>,
      false,
      /**
       * @description Here, the goal is actually to locate the parent node data of the map,
       * which refers to the grandparent node data in the `keyChains` hierarchy
       * of the proxy target object of the current `clear` prototype function.
       */
      thisArg[__GRANDPARENT_KEY__],
      firstLevelKey,
      keyChains,
      applyOriginFunction,
    );
  };
};

export const applyDeleteFactory: MapPrototypeProxyableFactoryType = <S extends PrimitiveState>(
  _storeProxyWeakMap: WeakMap<object, Store<S>>,
  applyOriginFunction: MapPrototypeProxyableValueType,
  thisArg: MapWithGrandparentKeyType<S>,
  parentTarget: MapType<S>,
  _createProxy: CreateProxyType<S>,
  firstLevelKey?: keyof S,
  keyChains?: Set<KeyChainsSourceItemType<S>>,
  singleUpdate?: (
    key: keyof S,
    value: ValueOf<S>,
    isDelete: boolean,
    target: object | S,
    firstLevelKey?: keyof S,
    keyChains?: Set<KeyChainsSourceItemType<S>>,
    applyOriginFunction?: ArrayPrototypeProxyableValueType,
  ) => boolean,
) => {
  return (key: keyof S) => {
    const curKey = Array.from(keyChains!).at(-1)?.key;
    parentTarget.delete(key);
    return singleUpdate!(
      curKey!,
      new Map(parentTarget) as ValueOf<S>,
      false,
      thisArg[__GRANDPARENT_KEY__],
      firstLevelKey,
      keyChains,
      applyOriginFunction,
    );
  };
};
