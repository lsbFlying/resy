import type { MapType, PrimitiveState, ValueOf } from "../types";
import {
  ProxyableType,
  CreateProxyType,
  ArrayPrototypeProxyableKeyType,
  ArrayPrototypeProxyableValueType,
  ArrayPrototypeProxyableCallbackType,
  ArrayPrototypeProxyableLoopFactoryType,
  ArrayPrototypeProxyableLoopFactoryValueType,
  ArrayPrototypeProxyableMutableArrayFactoryType,
  ArrayPrototypeProxyableMutableArraySortFactoryType,
  ArrayPrototypeProxyableMutableArraySpliceFactoryType,
  ArrayPrototypeProxyableMutableArrayCopyWithinFactoryType,
  MapPrototypeProxyableKeyType,
  MapPrototypeProxyableGetFactoryType,
  MapPrototypeProxyableValueType,
  KeyChainsSourceItemType,
} from "./types";
import type { Store } from "../store/types";
import { proxyable } from "./utils";

/** ============ Proxy factory for array prototype chain proxyable functions start ============ */
const applyTargetLoopFactory = <S extends PrimitiveState>(
  _storeProxyWeakMap: WeakMap<object, Store<S>>,
  applyOriginFunction: ArrayPrototypeProxyableValueType,
  _thisArg: any[],
  parentTarget: any[],
  createProxy: CreateProxyType<S>,
  firstLevelKey?: keyof S,
  keyChains?: Set<KeyChainsSourceItemType<S>>,
) => {
  const applyTargetName = applyOriginFunction.name as ArrayPrototypeProxyableKeyType;
  return (callback: ArrayPrototypeProxyableCallbackType) => {
    return (
      parentTarget[applyTargetName] as ArrayPrototypeProxyableLoopFactoryValueType
    )((item: any, index: number, array: any[]) => {
      return callback(
        proxyable(item)
          ? createProxy(
            item,
            parentTarget,
            firstLevelKey,
            keyChains?.add({ key: index }),
            applyOriginFunction,
          )
          : item,
        index,
        array,
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

    /**
     * @description TODO 这里仍然需要返回一个不可变性的数组代理，以保持不可变性的设计原则，待修改
     */
    return parentTarget;
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

    // TODO 这里仍然需要返回一个不可变性的数组代理，以保持不可变性的设计原则，待修改
    return parentTarget;
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
              keyChains?.add({ key: parentTarget.indexOf(a) }),
              applyOriginFunction,
            ) as T
            : a,
          proxyable(b)
            ? createProxy(
              b as ProxyableType<S>,
              parentTarget,
              firstLevelKey,
              keyChains?.add({ key: parentTarget.indexOf(b) }),
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

    // TODO 这里仍然需要返回一个不可变性的数组代理，以保持不可变性的设计原则，待修改
    return parentTarget;
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

    let copyAndTargetIsEqual = true;
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

    // TODO 这里仍然需要返回一个不可变性的数组代理，以保持不可变性的设计原则，待修改
    return parentTarget;
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
        keyChains?.add({ key }),
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
  | ArrayPrototypeProxyableMutableArrayFactoryType
  | ArrayPrototypeProxyableMutableArraySortFactoryType
  | ArrayPrototypeProxyableMutableArraySpliceFactoryType
  | ArrayPrototypeProxyableMutableArrayCopyWithinFactoryType
  | MapPrototypeProxyableGetFactoryType
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
  .set("shift", applyTargetShiftFactory)
  .set("unshift", applyTargetUnshiftFactory)
  .set("sort", applyTargetSortFactory)
  .set("splice", applyTargetSpliceFactory)
  .set("copyWithin", applyTargetCopyWithinFactory)
  .set("get", applyTargetGetFactory);
