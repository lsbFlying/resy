/**
 * @description prototype method proxies that do not mutate the original array.
 */

import type { PrimitiveState } from "../types";
import type {
  ProxyableType, CreateProxyType, ArrayPrototypeProxyableValueType,
  KeyChainsSourceItemType, ArrayLikeIteratorsType,
} from "./types";
import type { Store } from "../store/types";
import { iteratorProcessing, proxyable } from "./utils";

export const applyFlatFactory = <S extends PrimitiveState>(
  _storeProxyWeakMap: WeakMap<object, Map<any, Store<S>>>,
  applyOriginFunction: ArrayPrototypeProxyableValueType,
  _thisArg: any[],
  parentTarget: any[],
  createProxy: CreateProxyType<S>,
  firstLevelKey?: keyof S,
  keyChains?: Set<KeyChainsSourceItemType<S>>,
) => {
  return function <A, D extends number = 1>(this: A, depth?: D) {
    iteratorProcessing(
      parentTarget as any as ArrayLikeIteratorsType<S>, parentTarget,
      createProxy, firstLevelKey, keyChains, applyOriginFunction,
    );

    const depthTemp = depth ?? 1;
    const result = [] as FlatArray<A, D>[];

    // Recursive simulation flat method
    const flatten = (array: any[], currentDepth: number) => {
      for (const item of array) {
        if (Array.isArray(item) && currentDepth < depthTemp) {
          flatten(item, currentDepth + 1);
        } else {
          result.push(item);
        }
      }
    };

    flatten(parentTarget, 0);

    return result;
  };
};

export const applyToReversedFactory = <S extends PrimitiveState>(
  _storeProxyWeakMap: WeakMap<object, Map<any, Store<S>>>,
  applyOriginFunction: ArrayPrototypeProxyableValueType,
  _thisArg: any[],
  parentTarget: any[],
  createProxy: CreateProxyType<S>,
  firstLevelKey?: keyof S,
  keyChains?: Set<KeyChainsSourceItemType<S>>,
) => {
  return () => {
    const iterators = parentTarget.toReversed();
    iteratorProcessing(
      iterators as any as ArrayLikeIteratorsType<S>, parentTarget, createProxy,
      firstLevelKey, keyChains, applyOriginFunction, true,
    );
    return [...iterators];
  };
};

export const applyToSortedFactory = <S extends PrimitiveState>(
  _storeProxyWeakMap: WeakMap<object, Map<any, Store<S>>>,
  applyOriginFunction: ArrayPrototypeProxyableValueType,
  _thisArg: any[],
  parentTarget: any[],
  createProxy: CreateProxyType<S>,
  firstLevelKey?: keyof S,
  keyChains?: Set<KeyChainsSourceItemType<S>>,
) => {
  return <T>(compareFn?: (a: T, b: T) => number) => {
    const iterators = parentTarget.toSorted((a: T, b: T) => {
      return compareFn
        ? compareFn(
          proxyable(a)
            ? createProxy(
              a as ProxyableType<S>,
              parentTarget,
              firstLevelKey,
              new Set(keyChains).add({ key: parentTarget.indexOf(a) }),
              applyOriginFunction,
            ) as T
            : a,
          proxyable(b)
            ? createProxy(
                b as ProxyableType<S>,
                parentTarget,
                firstLevelKey,
                new Set(keyChains).add({ key: parentTarget.indexOf(b) }),
                applyOriginFunction,
            ) as T
            : b,
        )
        : (a as any).toString().localeCompare((b as any).toString());
    });

    /**
     * @description The processing of the `iteratorProcessing` method, combined with the `[...iterators]` return,
     * enables subsequent write operations on array elements to have proxy interception.
     * Additionally, during the execution of the `toSorted` method,
     * array elements are already handled with proxy interception,
     * and each array element proxy is bound to the element reference itself.
     * In other words, when the `[...iterators]` operation executes the `createProxy` proxy operation again,
     * it merely returns the proxy results from the previous `toSorted` method.
     * Refer to the code snippet:
     * `const spo = storeProxyWeakMap.get(target); ...`.
     */
    iteratorProcessing(
      iterators as any as ArrayLikeIteratorsType<S>, parentTarget,
      createProxy, firstLevelKey, keyChains, applyOriginFunction,
    );
    return [...iterators];
  };
};

export const applyAtFactory = <S extends PrimitiveState>(
  _storeProxyWeakMap: WeakMap<object, Map<any, Store<S>>>,
  applyOriginFunction: ArrayPrototypeProxyableValueType,
  _thisArg: any[],
  parentTarget: any[],
  createProxy: CreateProxyType<S>,
  firstLevelKey?: keyof S,
  keyChains?: Set<KeyChainsSourceItemType<S>>,
) => {
  return <T>(index: number): T | undefined => {
    const initLength = parentTarget.length;

    const numberIndex = Number(index ?? 0);

    const intIndex = isNaN(numberIndex)
      ? 0
      : Number.parseInt(numberIndex as any as string);
    const indexTemp = intIndex < 0
      ? (intIndex + initLength)
      : intIndex;

    const item = parentTarget.at(indexTemp);

    return proxyable(item)
      ? createProxy(
        item,
        parentTarget,
        firstLevelKey,
        new Set(keyChains).add({ key: indexTemp }),
        applyOriginFunction,
      ) as T
      : item;
  };
};

export const applyArrayValuesFactory = <S extends PrimitiveState>(
  _storeProxyWeakMap: WeakMap<object, Map<any, Store<S>>>,
  applyOriginFunction: ArrayPrototypeProxyableValueType,
  _thisArg: any[],
  parentTarget: any[],
  createProxy: CreateProxyType<S>,
  firstLevelKey?: keyof S,
  keyChains?: Set<KeyChainsSourceItemType<S>>,
) => {
  return () => {
    const iterators = parentTarget.values();
    iteratorProcessing(
      iterators as any as ArrayLikeIteratorsType<S>, parentTarget,
      createProxy, firstLevelKey, keyChains, applyOriginFunction,
    );
    return iterators;
  };
};

export const applyConcatFactory = <S extends PrimitiveState>(
  _storeProxyWeakMap: WeakMap<object, Map<any, Store<S>>>,
  applyOriginFunction: ArrayPrototypeProxyableValueType,
  _thisArg: any[],
  parentTarget: any[],
  createProxy: CreateProxyType<S>,
  firstLevelKey?: keyof S,
  keyChains?: Set<KeyChainsSourceItemType<S>>,
) => {
  return <T>(...items: (T | ConcatArray<T>)[]): T[] => {
    iteratorProcessing(
      parentTarget as any as ArrayLikeIteratorsType<S>, parentTarget,
      createProxy, firstLevelKey, keyChains, applyOriginFunction,
    );
    return [...parentTarget].concat(...items);
  };
};

export const applyArrayEntriesFactory = <S extends PrimitiveState>(
  _storeProxyWeakMap: WeakMap<object, Map<any, Store<S>>>,
  applyOriginFunction: ArrayPrototypeProxyableValueType,
  _thisArg: any[],
  parentTarget: any[],
  createProxy: CreateProxyType<S>,
  firstLevelKey?: keyof S,
  keyChains?: Set<KeyChainsSourceItemType<S>>,
) => {
  return <T>() => {
    const iterators = parentTarget.entries();
    iteratorProcessing(
      iterators as any as ArrayLikeIteratorsType<S>, parentTarget, createProxy, firstLevelKey,
      keyChains, applyOriginFunction, undefined, true,
    );
    return iterators as ArrayIterator<[number, T]>;
  };
};

export const applySliceFactory = <S extends PrimitiveState>(
  _storeProxyWeakMap: WeakMap<object, Map<any, Store<S>>>,
  applyOriginFunction: ArrayPrototypeProxyableValueType,
  _thisArg: any[],
  parentTarget: any[],
  createProxy: CreateProxyType<S>,
  firstLevelKey?: keyof S,
  keyChains?: Set<KeyChainsSourceItemType<S>>,
) => {
  return (start?: number, end?: number) => {
    iteratorProcessing(
      parentTarget as any as ArrayLikeIteratorsType<S>, parentTarget,
      createProxy, firstLevelKey, keyChains, applyOriginFunction,
    );
    return [...parentTarget].slice(start, end);
  };
};

export const applyWithFactory = <S extends PrimitiveState>(
  _storeProxyWeakMap: WeakMap<object, Map<any, Store<S>>>,
  applyOriginFunction: ArrayPrototypeProxyableValueType,
  _thisArg: any[],
  parentTarget: any[],
  createProxy: CreateProxyType<S>,
  firstLevelKey?: keyof S,
  keyChains?: Set<KeyChainsSourceItemType<S>>,
) => {
  return <T>(index: number, value: T) => {
    iteratorProcessing(
      parentTarget as any as ArrayLikeIteratorsType<S>, parentTarget,
      createProxy, firstLevelKey, keyChains, applyOriginFunction,
    );
    return [...parentTarget].with(index, value);
  };
};
