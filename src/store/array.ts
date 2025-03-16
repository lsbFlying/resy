import type { PrimitiveState } from "../types";
import {
  Store, ArrayPrototypeProxyableKeyType, ArrayPrototypeProxyableCallbackType,
  ArrayPrototypeProxyableLoopFactoryType, ArrayPrototypeProxyableMutableArrayFactoryType,
  ArrayPrototypeProxyableMutableArraySortFactoryType,
  ArrayPrototypeProxyableLoopFactoryValueType, ArrayPrototypeProxyableValueType,
  ArrayPrototypeProxyableMutableArraySpliceFactoryType, CreateProxyType, ProxyableType,
} from "./types";
import { proxyable } from "./utils";
import { __KEY_CHAINS_CONCAT_SYMBOL__ } from "./static";

/** ============ Proxy factory for array prototype chain proxyable functions start ============ */
const applyTargetLoopFactory = <S extends PrimitiveState>(
  _storeProxyWeakMap: WeakMap<object, Store<S>>,
  applyOriginFunction: ArrayPrototypeProxyableValueType,
  _thisArg: any[],
  parentTarget: any[],
  createProxy: CreateProxyType<S>,
  firstLevelKey?: any,
  keyChains?: string,
) => {
  const applyTargetName = applyOriginFunction.name as ArrayPrototypeProxyableKeyType;
  return (callback: ArrayPrototypeProxyableCallbackType) => {
    // todo 因为这里用到了parentTarget，所以后续需要销毁清楚，以便于后续能拿到最新的parentTarget
    const res = (
      parentTarget[applyTargetName] as ArrayPrototypeProxyableLoopFactoryValueType
    )((item: any, index: number, array: any[]) => {
      let itemTemp = item;
      if (proxyable(item)) {
        itemTemp = createProxy(
          item,
          parentTarget,
          firstLevelKey,
          `${keyChains}${__KEY_CHAINS_CONCAT_SYMBOL__}${index}`,
          applyOriginFunction,
        );
      }
      return callback(itemTemp, index, array);
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
    // todo 额外进行一个空添加，便与通过length进行更新数据
    parentTarget.push(...items, null);
    thisArg.length = resultLength;

    // todo 父元素对象一旦更新，立即销毁之前的代理对象，否则会拿不到最新的父元素对象
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

    // todo 这里也要销毁之前的代理对象，因为此时这里pop一定会更新数组，
    //  此时parentTarget已经发生变化了，所有必须销毁，
    //  否则结合其他原型链代理方法时会造成其他原型链代理方法中拿不到最新的parentTarget
    //  也就是一旦发生数组更新，就必须销毁之前的代理对象
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
    const startIndex = startTemp < 0 ? (startTemp + length) : startTemp;
    const endIndex = endTemp < 0 ? (endTemp + length) : endTemp;

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

      // todo 相比于通过遍历进行索引更新，这种方式更简单高效
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

      // todo 父元素对象一旦更新，立即销毁之前的代理对象，否则会拿不到最新的父元素对象
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
    // todo 因为下面的shift以及push方法都需要用到parentTarget，所以后续需要销毁清楚，以便于后续能拿到最新的parentTarget
    // todo 这里不使用thisArg（数组代理）调用shift方法，否则会进入无限循环
    const firstElement = parentTarget.shift();
    // In order to update through the length property,
    // the original first element is added to the end of the array
    parentTarget.push(firstElement);
    thisArg.length = length - 1;

    // todo 父元素对象一旦更新，立即销毁之前的代理对象，否则会拿不到最新的父元素对象
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
    // todo 额外进行一个空添加，便与通过length进行更新数据
    parentTarget.push(null);
    thisArg.length = resultLength;

    // todo 父元素对象一旦更新，立即销毁之前的代理对象，否则会拿不到最新的父元素对象
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
  firstLevelKey?: any,
  keyChains?: string,
) => {
  return <T>(compareFn?: (a: T, b: T) => number) => {
    let changed = false;

    const sortResult = parentTarget.sort((a: T, b: T) => {
      let aTemp = a;
      let bTemp = b;
      if (proxyable(aTemp)) {
        aTemp = createProxy(
          a as ProxyableType<S>,
          parentTarget,
          firstLevelKey,
          `${keyChains}${__KEY_CHAINS_CONCAT_SYMBOL__}${parentTarget.indexOf(a)}`,
          applyOriginFunction,
        ) as T;
      }
      if (proxyable(bTemp)) {
        bTemp = createProxy(
          b as ProxyableType<S>,
          parentTarget,
          firstLevelKey,
          `${keyChains}${__KEY_CHAINS_CONCAT_SYMBOL__}${parentTarget.indexOf(b)}`,
          applyOriginFunction,
        ) as T;
      }

      const compareResultValue = compareFn
        ? compareFn(aTemp, bTemp)
        : (a as any).toString().localeCompare((b as any).toString());

      if (compareResultValue !== 0) {
        changed = true;
      }
      return compareResultValue;
    });

    if (changed) {
      parentTarget.push(null);
      thisArg.length = parentTarget.length - 1;

      // todo 因为用到了parentTarget，所以这里需要销毁清楚，以便于后续能拿到最新的parentTarget
      // todo 父元素对象一旦更新，立即销毁之前的代理对象，否则会拿不到最新的父元素对象
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
      // todo 额外进行一个空添加，便与通过length进行更新数据
      parentTarget.push(null);
      thisArg.length = parentTarget.length - 1;

      // todo 父元素对象一旦更新，立即销毁之前的代理对象，否则会拿不到最新的父元素对象
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
