/**
 * @description prototype method proxies for set.
 */

import type { PrimitiveState, ValueOf } from "../types";
import type {
  ProxyableType, CreateProxyType, SetPrototypeProxyableValueType,
  KeyChainsSourceItemType, SetPrototypeProxyableFactoryType,
  SetWithGrandparentKeyType, ApplyOriginFunctionType, IteratorsType,
} from "./types";
import type { Store } from "../store/types";
import { iteratorProcessing, proxyable } from "./utils";
import { __GRANDPARENT_KEY__ } from "./static";

export const applyAddFactory: SetPrototypeProxyableFactoryType = <S extends PrimitiveState>(
  _storeProxyWeakMap: WeakMap<object, Map<any, Store<S>>>,
  applyOriginFunction: SetPrototypeProxyableValueType,
  thisArg: SetWithGrandparentKeyType<S>,
  parentTarget: Set<S>,
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
  return (value: S) => {
    const curKey = Array.from(keyChains!).at(-1)?.key;
    parentTarget.add(value);
    const result = new Set(parentTarget);
    singleUpdate?.(
      curKey!,
      result as ValueOf<S>,
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
    return result;
  };
};

export const applySetClearFactory: SetPrototypeProxyableFactoryType = <S extends PrimitiveState>(
  _storeProxyWeakMap: WeakMap<object, Map<any, Store<S>>>,
  applyOriginFunction: SetPrototypeProxyableValueType,
  thisArg: SetWithGrandparentKeyType<S>,
  _parentTarget: Set<S>,
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
      new Set() as ValueOf<S>,
      false,
      thisArg[__GRANDPARENT_KEY__],
      firstLevelKey,
      keyChains,
      applyOriginFunction,
    );
  };
};

export const applySetDeleteFactory: SetPrototypeProxyableFactoryType = <S extends PrimitiveState>(
  _storeProxyWeakMap: WeakMap<object, Map<any, Store<S>>>,
  applyOriginFunction: SetPrototypeProxyableValueType,
  thisArg: SetWithGrandparentKeyType<S>,
  parentTarget: Set<S>,
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
  return (value: S) => {
    const curKey = Array.from(keyChains!).at(-1)?.key;
    parentTarget.delete(value);
    return singleUpdate!(
      curKey!,
      new Set(parentTarget) as ValueOf<S>,
      false,
      thisArg[__GRANDPARENT_KEY__],
      firstLevelKey,
      keyChains,
      applyOriginFunction,
    );
  };
};

// todo waiting develop
export const applySetForEachFactory: SetPrototypeProxyableFactoryType = <S extends PrimitiveState>(
  _storeProxyWeakMap: WeakMap<object, Map<any, Store<S>>>,
  applyOriginFunction: SetPrototypeProxyableValueType,
  thisArg: SetWithGrandparentKeyType<S>,
  parentTarget: Set<S>,
  createProxy: CreateProxyType<S>,
  firstLevelKey?: keyof S,
  keyChains?: Set<KeyChainsSourceItemType<S>>,
) => {
  return (callback: (value: S, value2: S, set: Set<S>) => void) => {
    parentTarget.forEach((value, value2) => {
      callback(
        proxyable(value)
          ? (
            createProxy(
              value as ProxyableType<S>,
              parentTarget,
              firstLevelKey,
              // todo waiting modified
              new Set(keyChains).add({ key: "?" }),
              applyOriginFunction,
            ) as ValueOf<S>
          )
          : value,
        proxyable(value2)
          ? (
            createProxy(
              value2 as ProxyableType<S>,
              parentTarget,
              firstLevelKey,
              // todo waiting modified
              new Set(keyChains).add({ key: "?" }),
              applyOriginFunction,
            ) as ValueOf<S>
          )
          : value2,
        // TODO waiting test
        thisArg,
      );
    });
  };
};

// todo waiting develop
export const applySetKeysValuesFactory: SetPrototypeProxyableFactoryType = <S extends PrimitiveState>(
  _storeProxyWeakMap: WeakMap<object, Map<any, Store<S>>>,
  applyOriginFunction: SetPrototypeProxyableValueType,
  _thisArg: SetWithGrandparentKeyType<S>,
  parentTarget: Set<S>,
  createProxy: CreateProxyType<S>,
  firstLevelKey?: keyof S,
  keyChains?: Set<KeyChainsSourceItemType<S>>,
) => {
  return () => {
    const iterators = parentTarget.values();
    iteratorProcessing(
      iterators as any as IteratorsType<S>, parentTarget, createProxy,
      firstLevelKey, keyChains, applyOriginFunction,
    );
    return iterators;
  };
};

// todo waiting develop
export const applySetEntriesFactory: SetPrototypeProxyableFactoryType = <S extends PrimitiveState>(
  _storeProxyWeakMap: WeakMap<object, Map<any, Store<S>>>,
  applyOriginFunction: SetPrototypeProxyableValueType,
  _thisArg: SetWithGrandparentKeyType<S>,
  parentTarget: Set<S>,
  createProxy: CreateProxyType<S>,
  firstLevelKey?: keyof S,
  keyChains?: Set<KeyChainsSourceItemType<S>>,
) => {
  return () => {
    const iterators = parentTarget.entries();
    iteratorProcessing(
      iterators as any as IteratorsType<S>, parentTarget, createProxy,
      firstLevelKey, keyChains, applyOriginFunction, true,
    );
    return iterators;
  };
};
