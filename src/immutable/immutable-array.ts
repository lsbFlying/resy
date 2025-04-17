/**
 * @description prototype method proxies that do not mutate the original array.
 */

import type { PrimitiveState } from "../types";
import type {
  ProxyableType, CreateProxyType,
  ArrayPrototypeProxyableValueType, KeyChainsSourceItemType,
} from "./types";
import type { Store } from "../store/types";
import { iteratorProcessing, proxyable } from "./utils";

export const applyFlatFactory = <S extends PrimitiveState>(
  _storeProxyWeakMap: WeakMap<object, Store<S>>,
  _applyOriginFunction: ArrayPrototypeProxyableValueType,
  _thisArg: any[],
  parentTarget: any[],
) => {
  return function <A, D extends number = 1>(this: A, depth?: D) {
    const depthTemp = depth ?? 1;
    const result = [] as FlatArray<A, D>[];

    // Recursive simulation flat method
    const flatten = (array: any[], currentDepth: number) => {
      for (const item of array) {
        if (Array.isArray(item) && currentDepth < depthTemp) {
          flatten(item, currentDepth + 1); // 递归处理
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
  _storeProxyWeakMap: WeakMap<object, Store<S>>,
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
      iterators as any, parentTarget, createProxy, firstLevelKey,
      keyChains, applyOriginFunction, true,
    );
    return [...iterators];
  };
};

export const applyToSortedFactory = <S extends PrimitiveState>(
  _storeProxyWeakMap: WeakMap<object, Store<S>>,
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
     * `const spw = storeProxyWeakMap.get(target); if (spw) return spw;`.
     */
    iteratorProcessing(
      iterators as any, parentTarget, createProxy,
      firstLevelKey, keyChains, applyOriginFunction,
    );
    return [...iterators];
  };
};

export const applyAtFactory = <S extends PrimitiveState>(
  _storeProxyWeakMap: WeakMap<object, Store<S>>,
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

export const applyValuesFactory = <S extends PrimitiveState>(
  _storeProxyWeakMap: WeakMap<object, Store<S>>,
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
      iterators as any, parentTarget, createProxy,
      firstLevelKey, keyChains, applyOriginFunction,
    );
    return iterators;
  };
};

export const applyConcatFactory = <S extends PrimitiveState>(
  _storeProxyWeakMap: WeakMap<object, Store<S>>,
  _applyOriginFunction: ArrayPrototypeProxyableValueType,
  _thisArg: any[],
  parentTarget: any[],
) => {
  return <T>(...items: (T | ConcatArray<T>)[]): T[] => {
    return [...parentTarget].concat(...items);
  };
};

export const applyEntriesFactory = <S extends PrimitiveState>(
  _storeProxyWeakMap: WeakMap<object, Store<S>>,
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
      iterators as any, parentTarget, createProxy, firstLevelKey,
      keyChains, applyOriginFunction, undefined, true,
    );
    return iterators as ArrayIterator<[number, T]>;
  };
};

export const applySliceFactory = <S extends PrimitiveState>(
  _storeProxyWeakMap: WeakMap<object, Store<S>>,
  _applyOriginFunction: ArrayPrototypeProxyableValueType,
  _thisArg: any[],
  parentTarget: any[],
) => {
  return (start?: number, end?: number) => {
    return [...parentTarget].slice(start, end);
  };
};

export const applyWithFactory = <S extends PrimitiveState>(
  _storeProxyWeakMap: WeakMap<object, Store<S>>,
  _applyOriginFunction: ArrayPrototypeProxyableValueType,
  _thisArg: any[],
  parentTarget: any[],
) => {
  return <T>(index: number, value: T) => {
    return [...parentTarget].with(index, value);
  };
};
