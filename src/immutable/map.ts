/**
 * @description prototype method proxies for map.
 */

import type { MapType, PrimitiveState, ValueOf } from "../types";
import type {
  ProxyableType, CreateProxyType, MapPrototypeProxyableValueType,
  KeyChainsSourceItemType, MapPrototypeProxyableFactoryType,
  MapWithGrandparentKeyType, ApplyOriginFunctionType, ArrayLikeIteratorsType,
} from "./types";
import type { Store } from "../store/types";
import { iteratorProcessing, proxyable } from "./utils";
import { __GRANDPARENT_KEY__ } from "./static";

export const applyGetFactory = <S extends PrimitiveState>(
  _storeProxyWeakMap: WeakMap<object, Map<any, Store<S>>>,
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
        parentTarget,
        firstLevelKey,
        new Set(keyChains).add({ key }),
        applyOriginFunction,
      ) as ValueOf<S>
      : value;
  };
};

export const applyClearFactory: MapPrototypeProxyableFactoryType = <S extends PrimitiveState>(
  _storeProxyWeakMap: WeakMap<object, Map<any, Store<S>>>,
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
    applyOriginFunction?: ApplyOriginFunctionType,
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
  _storeProxyWeakMap: WeakMap<object, Map<any, Store<S>>>,
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
    applyOriginFunction?: ApplyOriginFunctionType,
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

export const applySetFactory: MapPrototypeProxyableFactoryType = <S extends PrimitiveState>(
  _storeProxyWeakMap: WeakMap<object, Map<any, Store<S>>>,
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
    applyOriginFunction?: ApplyOriginFunctionType,
  ) => boolean,
) => {
  return (key: keyof S, value: ValueOf<S>) => {
    const curKey = Array.from(keyChains!).at(-1)?.key;
    parentTarget.set(key, value);
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

export const applyForEachFactory: MapPrototypeProxyableFactoryType = <S extends PrimitiveState>(
  _storeProxyWeakMap: WeakMap<object, Map<any, Store<S>>>,
  applyOriginFunction: MapPrototypeProxyableValueType,
  thisArg: MapWithGrandparentKeyType<S>,
  parentTarget: MapType<S>,
  createProxy: CreateProxyType<S>,
  firstLevelKey?: keyof S,
  keyChains?: Set<KeyChainsSourceItemType<S>>,
) => {
  return (callback: (value: ValueOf<S>, key: keyof S, map: Map<keyof S, ValueOf<S>>) => void) => {
    parentTarget.forEach((value, key) => {
      callback(
        proxyable(value)
          ? (
            createProxy(
              value as ProxyableType<S>,
              parentTarget,
              firstLevelKey,
              new Set(keyChains).add({ key }),
              applyOriginFunction,
            ) as ValueOf<S>
          )
          : value,
        /**
         * @description There is no need to proxy the `key`.
         * Even if the keys are reference types and the internal data of the referenced objects changes,
         * it should not trigger changes in the `Map`,
         * as the state of the `Map` depends on the key's reference rather than the key's content.
         */
        key,
        // TODO waiting test
        thisArg,
      );
    });
  };
};

export const applyMapValuesFactory: MapPrototypeProxyableFactoryType = <S extends PrimitiveState>(
  _storeProxyWeakMap: WeakMap<object, Map<any, Store<S>>>,
  applyOriginFunction: MapPrototypeProxyableValueType,
  _thisArg: MapWithGrandparentKeyType<S>,
  parentTarget: MapType<S>,
  createProxy: CreateProxyType<S>,
  firstLevelKey?: keyof S,
  keyChains?: Set<KeyChainsSourceItemType<S>>,
) => {
  return () => {
    const iterators = parentTarget.values();
    iteratorProcessing(
      iterators as any as ArrayLikeIteratorsType<S>, parentTarget, createProxy,
      firstLevelKey, keyChains, applyOriginFunction,
    );
    return iterators;
  };
};
