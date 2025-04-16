import type { MapType, PrimitiveState, ValueOf } from "../types";
import type {
  ProxyableType,
  CreateProxyType,
  ArrayPrototypeProxyableKeyType,
  ArrayPrototypeProxyableValueType,
  ArrayPrototypeProxyableCallbackType,
  ArrayPrototypeProxyableLoopFactoryType,
  ArrayPrototypeProxyableLoopFactoryValueType,
  ArrayPrototypeProxyableFactoryType,
  ArrayPrototypeProxyableSortFactoryType,
  ArrayPrototypeProxyableSpliceFactoryType,
  ArrayPrototypeProxyableCopyWithinFactoryType,
  ArrayPrototypeProxyableAtFactoryType,
  MapPrototypeProxyableKeyType,
  MapPrototypeProxyableGetFactoryType,
  MapPrototypeProxyableValueType,
  KeyChainsSourceItemType,
  ArrayPrototypeProxyableValuesFactoryType,
  ArrayPrototypeProxyableConcatFactoryType,
  ArrayPrototypeProxyableEntriesFactoryType,
} from "./types";
import type { Store } from "../store/types";
import { iteratorProcessing, proxyable } from "./utils";

/** ============ Proxy factory for array prototype chain proxyable functions start ============ */
const applyTargetLoopFactory = <S extends PrimitiveState>(
  _storeProxyWeakMap: WeakMap<object, Store<S>>,
  applyOriginFunction: ArrayPrototypeProxyableValueType,
  thisArg: any[],
  parentTarget: any[],
  createProxy: CreateProxyType<S>,
  firstLevelKey?: keyof S,
  keyChains?: Set<KeyChainsSourceItemType<S>>,
) => {
  const applyTargetName = applyOriginFunction.name as ArrayPrototypeProxyableKeyType;
  return (callback: ArrayPrototypeProxyableCallbackType) => {
    return (
      parentTarget[applyTargetName] as ArrayPrototypeProxyableLoopFactoryValueType
    )((item: any, index: number) => {
      return callback(
        proxyable(item)
          ? createProxy(
            item,
            parentTarget,
            firstLevelKey,
            new Set(keyChains).add({ key: index }),
            applyOriginFunction,
          )
          : item,
        index,
        thisArg,
      );
    }) as any;
  };
};

const applyTargetPushFactory = <S extends PrimitiveState>(
  storeProxyWeakMap: WeakMap<object, Store<S>>,
  applyOriginFunction: ArrayPrototypeProxyableValueType,
  thisArg: any[],
  parentTarget: any[],
) => {
  return (...items: any[]) => {
    const resultLength = parentTarget.length + items.length;
    // Perform an additional empty insertion to facilitate updating data via the `length`.
    parentTarget.push(...items, null);
    thisArg.length = resultLength;

    /**
     * @description Once the parent element object is updated,
     * immediately destroy the previous proxy object,
     * otherwise the latest parent element object will not be obtained.
     */
    storeProxyWeakMap.delete(applyOriginFunction);

    return resultLength;
  };
};

const applyTargetPopFactory = <S extends PrimitiveState>(
  storeProxyWeakMap: WeakMap<object, Store<S>>,
  applyOriginFunction: ArrayPrototypeProxyableValueType,
  thisArg: any[],
  parentTarget: any[],
) => {
  return () => {
    const length = parentTarget.length;
    if (length === 0) return undefined;

    const lastIndex = length - 1;
    const lastItem = parentTarget[lastIndex];

    thisArg.length = lastIndex;

    storeProxyWeakMap.delete(applyOriginFunction);

    /**
     * @description When using `pop`, the removed element is the last one,
     * and the removed last element no longer affects rendering.
     * Even if the "removed last element" is pushed back later,
     * a new round of proxy processing will still handle it.
     * Hence, there is no need to perform proxy processing here.
     * Even if proxy processing were attempted,
     * it would be impossible to trace the key in the property chain of the new proxy layer,
     * as it has already been removed from the "rendered state array data"
     * and its corresponding index in the property chain's key cannot be found for completion.
     */
    return lastItem;
  };
};

const applyTargetFillFactory = <S extends PrimitiveState>(
  storeProxyWeakMap: WeakMap<object, Store<S>>,
  applyOriginFunction: ArrayPrototypeProxyableValueType,
  thisArg: any[],
  parentTarget: any[],
) => {
  return <T>(value: T, start?: number, end?: number) => {
    const length = parentTarget.length;

    const startTemp = start ?? 0;
    const endTemp = end ?? length;
    const startIndex = startTemp < 0 ? Math.max(startTemp + length, 0) : Math.min(startTemp, length);
    const endIndex = endTemp < 0 ? Math.max(endTemp + length, 0) : Math.min(endTemp, length);

    let changed = false;

    for (let left = startIndex, right = endIndex; left <= right; left++, right--) {
      if (!Object.is(parentTarget[left], value) || !Object.is(parentTarget[right], value)) {
        changed = true;
        break;
      }
    }

    if (changed) {
      parentTarget.fill(value, start, end);
      parentTarget.push(null);

      thisArg.length = length;

      storeProxyWeakMap.delete(applyOriginFunction);
    }

    // We still need to return an array proxy here
    // to maintain "Forced Chain Proxyization of Return Values"
    return thisArg;
  };
};

const applyTargetReverseFactory = <S extends PrimitiveState>(
  storeProxyWeakMap: WeakMap<object, Store<S>>,
  applyOriginFunction: ArrayPrototypeProxyableValueType,
  thisArg: any[],
  parentTarget: any[],
) => {
  return () => {
    const endIndex = parentTarget.length - 1;
    let changed = false;

    for (let left = 0, right = endIndex; left < right; left++, right--) {
      if (!Object.is(parentTarget[left], parentTarget[right])) {
        changed = true;
        break;
      }
    }

    if (changed) {
      parentTarget.reverse();
      parentTarget.push(null);

      thisArg.length = parentTarget.length - 1;

      storeProxyWeakMap.delete(applyOriginFunction);
    }

    return thisArg;
  };
};

const applyTargetToReversedFactory = <S extends PrimitiveState>(
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

const applyTargetShiftFactory = <S extends PrimitiveState>(
  storeProxyWeakMap: WeakMap<object, Store<S>>,
  applyOriginFunction: ArrayPrototypeProxyableValueType,
  thisArg: any[],
  parentTarget: any[],
) => {
  return () => {
    const length = parentTarget.length;
    if (length === 0) return undefined;
    // Do not use thisArg (array proxy) to call the shift method here, otherwise it will enter an infinite loop
    const firstElement = parentTarget.shift();
    // In order to update through the length property,
    // the original first element is added to the end of the array
    parentTarget.push(firstElement);
    thisArg.length = length - 1;

    storeProxyWeakMap.delete(applyOriginFunction);

    // This is consistent with the return comment of the `applyTargetPopFactory` function.
    return firstElement;
  };
};

const applyTargetUnshiftFactory = <S extends PrimitiveState>(
  storeProxyWeakMap: WeakMap<object, Store<S>>,
  applyOriginFunction: ArrayPrototypeProxyableValueType,
  thisArg: any[],
  parentTarget: any[],
) => {
  return (...items: any[]) => {
    const resultLength = parentTarget.length + items.length;
    parentTarget.unshift(...items);

    parentTarget.push(null);
    thisArg.length = resultLength;

    storeProxyWeakMap.delete(applyOriginFunction);

    return resultLength;
  };
};

const applyTargetSortFactory = <S extends PrimitiveState>(
  storeProxyWeakMap: WeakMap<object, Store<S>>,
  applyOriginFunction: ArrayPrototypeProxyableValueType,
  thisArg: any[],
  parentTarget: any[],
  createProxy: CreateProxyType<S>,
  firstLevelKey?: keyof S,
  keyChains?: Set<KeyChainsSourceItemType<S>>,
) => {
  return <T>(compareFn?: (a: T, b: T) => number) => {
    let changed = false;

    parentTarget.sort((a: T, b: T) => {
      const compareResultValue = compareFn
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

      if (compareResultValue !== 0) {
        changed = true;
      }
      return compareResultValue;
    });

    if (changed) {
      parentTarget.push(null);
      thisArg.length = parentTarget.length - 1;

      storeProxyWeakMap.delete(applyOriginFunction);
    }

    return thisArg;
  };
};

const applyTargetToSortedFactory = <S extends PrimitiveState>(
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

const applyTargetSpliceFactory = <S extends PrimitiveState>(
  storeProxyWeakMap: WeakMap<object, Store<S>>,
  applyOriginFunction: ArrayPrototypeProxyableValueType,
  thisArg: any[],
  parentTarget: any[],
) => {
  return <T>(start: number, deleteCount: number, ...items: T[]) => {
    const deleteResult = parentTarget.splice(start, deleteCount, ...items);

    if (deleteResult.length > 0 || items.length > 0) {
      parentTarget.push(null);
      thisArg.length = parentTarget.length - 1;

      storeProxyWeakMap.delete(applyOriginFunction);
    }

    // This is consistent with the return comment of the `applyTargetPopFactory` function.
    return deleteResult;
  };
};

const applyTargetCopyWithinFactory = <S extends PrimitiveState>(
  storeProxyWeakMap: WeakMap<object, Store<S>>,
  applyOriginFunction: ArrayPrototypeProxyableValueType,
  thisArg: any[],
  parentTarget: any[],
) => {
  return <T>(target: number, start: number, end?: number): T[] => {
    const initLength = parentTarget.length;

    const normalizedTarget = target < 0
      ? Math.max(initLength + target, 0)
      : Math.min(target, initLength);

    const normalizedStart = start < 0
      ? Math.max(initLength + start, 0)
      : Math.min(start, initLength);

    const endTemp = end ?? initLength;
    const normalizedEnd = endTemp < 0
      ? Math.max(initLength + endTemp, 0)
      : Math.min(endTemp, initLength);

    const copyLength = Math.max(normalizedEnd - normalizedStart, 0);

    // The actual replication length may not be as long as originally planned due to insufficient target space,
    const actualCopyLength = Math.min(copyLength, initLength - normalizedTarget);
    // The actual replication length is not as long as originally planned,
    // so its replication boundary will correspondingly decrease,
    // so here we perform a boundary optimization to reduce the count of subsequent loops.
    const endSourceIdx = normalizedStart + actualCopyLength;

    const changedPrevCondition = copyLength > 0 && normalizedTarget < initLength;

    let copyAndTargetIsEqual = changedPrevCondition;
    if (changedPrevCondition) {
      for (
        let sourceIdx = normalizedStart, targetIdx = normalizedTarget;
        sourceIdx < endSourceIdx && targetIdx < initLength;
        sourceIdx++, targetIdx++
      ) {
        // Compare whether the copied element is the same as the target index element.
        // If they are the same, it is not considered a change.
        if (!Object.is(parentTarget[sourceIdx], parentTarget[targetIdx])) {
          copyAndTargetIsEqual = false;
          break;
        }
      }
    }

    // The number of copied elements is greater than 0 and the target position is valid.
    if (changedPrevCondition && !copyAndTargetIsEqual) {
      parentTarget.copyWithin(target, start, end);

      parentTarget.push(null);
      thisArg.length = parentTarget.length - 1;

      storeProxyWeakMap.delete(applyOriginFunction);
    }

    return thisArg;
  };
};

const applyTargetAtFactory = <S extends PrimitiveState>(
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

const applyTargetValuesFactory = <S extends PrimitiveState>(
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

const applyTargetConcatFactory = <S extends PrimitiveState>(
  _storeProxyWeakMap: WeakMap<object, Store<S>>,
  _applyOriginFunction: ArrayPrototypeProxyableValueType,
  _thisArg: any[],
  parentTarget: any[],
) => {
  return <T>(...items: (T | ConcatArray<T>)[]): T[] => {
    return [...parentTarget].concat(...items);
  };
};

const applyTargetEntriesFactory = <S extends PrimitiveState>(
  _storeProxyWeakMap: WeakMap<object, Store<S>>,
  applyOriginFunction: ArrayPrototypeProxyableValueType,
  _thisArg: any[],
  parentTarget: any[],
  createProxy: CreateProxyType<S>,
  firstLevelKey?: keyof S,
  keyChains?: Set<KeyChainsSourceItemType<S>>,
) => {
  return () => {
    const iterators = parentTarget.entries();
    iteratorProcessing(
      iterators as any, parentTarget, createProxy, firstLevelKey,
      keyChains, applyOriginFunction, undefined, true,
    );
    return iterators;
  };
};
/** ============ Proxy factory for array prototype chain proxyable functions end ============ */

/** ============ Proxy factory for map prototype chain proxyable functions start ============ */
const applyTargetGetFactory = <S extends PrimitiveState>(
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

export const __ARRAY_MAP_SET_PROTOTYPE_PROXYABLE_TARGET_MAP__ = new Map<
  | ArrayPrototypeProxyableKeyType
  | MapPrototypeProxyableKeyType,
  | ArrayPrototypeProxyableLoopFactoryType
  | ArrayPrototypeProxyableFactoryType
  | ArrayPrototypeProxyableSortFactoryType
  | ArrayPrototypeProxyableSpliceFactoryType
  | ArrayPrototypeProxyableCopyWithinFactoryType
  | ArrayPrototypeProxyableAtFactoryType
  | ArrayPrototypeProxyableValuesFactoryType
  | MapPrototypeProxyableGetFactoryType
  | ArrayPrototypeProxyableConcatFactoryType
  | ArrayPrototypeProxyableEntriesFactoryType
>()
  .set("forEach", applyTargetLoopFactory)
  .set("map", applyTargetLoopFactory)
  .set("filter", applyTargetLoopFactory)
  .set("find", applyTargetLoopFactory)
  .set("findIndex", applyTargetLoopFactory)
  .set("findLast", applyTargetLoopFactory)
  .set("findLastIndex", applyTargetLoopFactory)
  .set("every", applyTargetLoopFactory)
  .set("some", applyTargetLoopFactory)
  .set("flatMap", applyTargetLoopFactory)
  .set("push", applyTargetPushFactory)
  .set("pop", applyTargetPopFactory)
  .set("fill", applyTargetFillFactory)
  .set("reverse", applyTargetReverseFactory)
  .set("toReversed", applyTargetToReversedFactory)
  .set("shift", applyTargetShiftFactory)
  .set("unshift", applyTargetUnshiftFactory)
  .set("sort", applyTargetSortFactory)
  .set("toSorted", applyTargetToSortedFactory)
  .set("splice", applyTargetSpliceFactory)
  .set("copyWithin", applyTargetCopyWithinFactory)
  .set("at", applyTargetAtFactory)
  .set("values", applyTargetValuesFactory)
  .set("concat", applyTargetConcatFactory)
  .set("entries", applyTargetEntriesFactory)
  .set("get", applyTargetGetFactory);
