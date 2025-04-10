import type { PrimitiveState } from "../types";
import type {
  ArrayPrototypeProxyableKeyType, ArrayPrototypeProxyableCallbackType,
  ArrayPrototypeProxyableLoopFactoryType, ArrayPrototypeProxyableMutableArrayFactoryType,
  ArrayPrototypeProxyableMutableArraySortFactoryType,
  ArrayPrototypeProxyableLoopFactoryValueType, ArrayPrototypeProxyableValueType,
  ArrayPrototypeProxyableMutableArraySpliceFactoryType, CreateProxyType, ProxyableType,
} from "./types";
import type { Store } from "../store/types";
import { proxyable } from "./utils";
import { __KEY_CHAINS_CONCAT_SYMBOL__ } from "./static";

/** ============ Proxy factory for array prototype chain proxyable functions start ============ */
const applyTargetLoopFactory = <S extends PrimitiveState>(
  _storeProxyWeakMap: WeakMap<object, Store<S>>,
  applyOriginFunction: ArrayPrototypeProxyableValueType,
  _thisArg: any[],
  parentTarget: any[],
  createProxy: CreateProxyType<S>,
  firstLevelKey?: keyof S,
  keyChains?: string,
) => {
  const applyTargetName = applyOriginFunction.name as ArrayPrototypeProxyableKeyType;
  return (callback: ArrayPrototypeProxyableCallbackType) => {
    const res = (
      parentTarget[applyTargetName] as ArrayPrototypeProxyableLoopFactoryValueType
    )((item: any, index: number, array: any[]) => {
      return callback(
        proxyable(item)
          ? createProxy(
            item,
            parentTarget,
            firstLevelKey,
            `${keyChains}${__KEY_CHAINS_CONCAT_SYMBOL__}${index}`,
            applyOriginFunction,
          )
          : item,
        index,
        array,
      );
    });

    return res as any;
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
    const lastItem = thisArg[lastIndex];

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

    for (let i = startIndex; i < endIndex; i++) {
      if (!Object.is(thisArg[i], value)) {
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
    let start = 0;
    let end = parentTarget.length - 1;
    let changed = false;

    while (start < end) {
      if (!Object.is(parentTarget[start], parentTarget[end])) {
        changed = true;
        break;
      }
      start++;
      end--;
    }

    if (changed) {
      parentTarget.reverse();
      parentTarget.push(null);

      thisArg.length = parentTarget.length - 1;

      storeProxyWeakMap.delete(applyOriginFunction);
    }

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
  keyChains?: string,
) => {
  return <T>(compareFn?: (a: T, b: T) => number) => {
    let changed = false;

    const sortResult = parentTarget.sort((a: T, b: T) => {
      const compareResultValue = compareFn
        ? compareFn(
          proxyable(a)
            ? createProxy(
              a as ProxyableType<S>,
              parentTarget,
              firstLevelKey,
              `${keyChains}${__KEY_CHAINS_CONCAT_SYMBOL__}${parentTarget.indexOf(a)}`,
              applyOriginFunction,
            ) as T
            : a,
          proxyable(b)
            ? createProxy(
              b as ProxyableType<S>,
              parentTarget,
              firstLevelKey,
              `${keyChains}${__KEY_CHAINS_CONCAT_SYMBOL__}${parentTarget.indexOf(b)}`,
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

    return sortResult;
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
    // TODO 这里的deleteResult判断逻辑不对，deleteResult为空并不能代表没改变愿数组
    // error ❌： 只要返回的删除元素数组存在不为空，则一定变更了原数组内容
    if (deleteResult.length > 0) {
      parentTarget.push(null);
      thisArg.length = parentTarget.length - 1;

      storeProxyWeakMap.delete(applyOriginFunction);
    }

    return deleteResult;
  };
};

export const __ARRAY_PROTOTYPE_PROXYABLE_TARGET_MAP__ = new Map<
  ArrayPrototypeProxyableKeyType,
  | ArrayPrototypeProxyableLoopFactoryType
  | ArrayPrototypeProxyableMutableArrayFactoryType
  | ArrayPrototypeProxyableMutableArraySortFactoryType
  | ArrayPrototypeProxyableMutableArraySpliceFactoryType
>()
  .set("forEach", applyTargetLoopFactory)
  .set("map", applyTargetLoopFactory)
  .set("filter", applyTargetLoopFactory)
  .set("every", applyTargetLoopFactory)
  .set("some", applyTargetLoopFactory)
  .set("push", applyTargetPushFactory)
  .set("pop", applyTargetPopFactory)
  .set("fill", applyTargetFillFactory)
  .set("reverse", applyTargetReverseFactory)
  .set("shift", applyTargetShiftFactory)
  .set("unshift", applyTargetUnshiftFactory)
  .set("sort", applyTargetSortFactory)
  .set("splice", applyTargetSpliceFactory);
/** ============ Proxy factory for array prototype chain proxyable functions end ============ */
