import { whatsType, typeString, slice } from "../utils";
import type { MapType, PrimitiveState, ValueOf } from "../types";
import type {
  ApplyOriginFunctionType, IteratorsType, CreateProxyType,
  KeyChainsSourceItemType, ArrayMapSetIteratorType, IteratorsParentType,
} from "./types";
import { __ITERATOR_META_PROCESSING_KEY__ } from "./static";

// A collection of functions that can be executed by proxies for Maps、 Set prototype chains.
const mapSetPrototypeProxyableSet = new Set<ApplyOriginFunctionType>()
  // map
  .add(Map.prototype.get)
  .add(Map.prototype.clear)
  .add(Map.prototype.delete)
  .add(Map.prototype.set)
  .add(Map.prototype.forEach)
  .add(Map.prototype.values)
  .add(Map.prototype.entries)
  // map
  .add(Set.prototype.add)
  .add(Set.prototype.clear)
  .add(Set.prototype.delete)
  .add(Set.prototype.forEach)
  .add(Set.prototype.keys)
  .add(Set.prototype.values)
  .add(Set.prototype.entries);

const proxyableSet = new Set(["[object Object]", "[object Array]", "[object Map]", "[object Set]"]);

export const proxyable = (value: unknown) => {
  return proxyableSet.has(typeString.call(value))
    || mapSetPrototypeProxyableSet.has(value as ApplyOriginFunctionType);
};

/**
 * @description Create a new reference type data value with the same content based on the given reference type data.
 * Here, a few of the more common and widely used data types within the ComplexValueType are handled.
 */
export const createNewRefValue = <T>(value: T): T => {
  const type = typeString.call(value);
  switch (type) {
    case "[object Object]":
      return Object.assign({}, value);
    case "[object Array]":
      return slice.call(value as unknown[]) as T;
    case "[object Map]":
      return new Map(value as Iterable<readonly [unknown, unknown]>) as T;
    case "[object Set]":
      return new Set(value as Iterable<unknown>) as T;
    default:
      return value;
  }
};

/**
 * @description Custom iteration processing for iterable data types.
 * It also handles scenarios involving `for...of` loops.
 * The `for...of` loop reads the `Symbol.iterator` property,
 * which invokes iterator methods such as `values` or `entries`.
 * These methods are equipped with proxy handling.
 */
export const iteratorProcessing = <S extends PrimitiveState>(
  iterator: IteratorsType<S>,
  parentTarget: IteratorsParentType<S>,
  createProxy: CreateProxyType<S>,
  firstLevelKey?: keyof S,
  keyLevel?: number,
  keyChains?: Set<KeyChainsSourceItemType<S>>,
  applyOriginFunction?: ApplyOriginFunctionType,
  entriesFlag?: boolean,
) => {
  if (parentTarget[__ITERATOR_META_PROCESSING_KEY__]) return;
  const type = whatsType(iterator);

  const AM_IteratorFlag = type === "ArrayIterator" || type === "MapIterator";

  if (AM_IteratorFlag) {
    const keys = type === "MapIterator" ? parentTarget.keys().toArray() : null;
    const iteratorArray = AM_IteratorFlag
      ? (iterator as any as ArrayMapSetIteratorType<S>).toArray()
      : iterator;

    // Does not affect the primitive iterators on the prototype chain (prototype [Symbol. iterator])
    iterator[Symbol.iterator] = () => {
      // Index and conditional processing for toReversed method
      let index = -1;

      return {
        next() {
          index++;

          if (index < iteratorArray.length) {
            const key = entriesFlag
              ? iteratorArray[index][0]
              /**
               * @description In scenarios where the `map.values` method returns a `MapIterator`
               * and cannot retrieve the associated keys,
               * the `map.keys` method is used to obtain the corresponding keys for indexing.
               */
              : type === "MapIterator"
                ? keys[index]
                : index;
            const value = entriesFlag ? iteratorArray[index][1] : iteratorArray[index];

            return {
              done: false,
              value: entriesFlag
                ? [
                  key,
                  proxyable(value)
                    ? createProxy(
                      value,
                      parentTarget,
                      firstLevelKey,
                      (keyLevel ?? 0) + 1,
                      new Set(keyChains).add({ key }),
                      applyOriginFunction,
                    )
                    : value,
                ]
                : proxyable(value)
                  ? createProxy(
                    value,
                    parentTarget,
                    firstLevelKey,
                    (keyLevel ?? 0) + 1,
                    new Set(keyChains).add({ key }),
                    applyOriginFunction,
                  )
                  : value,
            };
          }
          return { done: true };
        }
      };
    };
    AM_IteratorFlag && (iterator.next = iterator[Symbol.iterator]().next);
    parentTarget[__ITERATOR_META_PROCESSING_KEY__] = true;
  }
};

export const reduceChanged = <S extends PrimitiveState>(
  value: ValueOf<S>,
  keyChains: Set<KeyChainsSourceItemType<S>>,
  firstLevelValue?: ValueOf<S>,
) => {
  // No first level attribute chain array
  const noneFirstLevelKeyChains: (keyof S)[] = [];
  for (const item of keyChains) {
    noneFirstLevelKeyChains.push(item.key);
  }
  noneFirstLevelKeyChains.shift();

  // TODO 应该可以通过递归循环优化处理
  noneFirstLevelKeyChains.reduce((
    previousValue,
    itemKey,
    currentIndex,
    array,
  ) => {
    const isMapType = whatsType(previousValue) === "Map";

    // TODO set类型的更新循环还没有完全开发验证完毕，waiting develop
    currentIndex !== array.length - 1
      /**
       * @description Update the attribute chain except for the attribute objects of each layer before the last level,
       * This is very important. If the update here is ignored,
       * it will result in the attribute chain's layer by layer properties not being treated as immutable,
       * which will create a dependency invariant bug on the hook's dependency array.
       */
      ? isMapType
        ? (previousValue as MapType<S>).set(
          itemKey,
          createNewRefValue((previousValue as MapType<S>).get(itemKey) as ValueOf<S>)
        )
        : ((previousValue as any)[itemKey] = createNewRefValue((previousValue as S)[itemKey]))
      // Update the attributes of the last level in the attribute chain
      : isMapType
        ? (previousValue as MapType<S>).set(itemKey, value)
        : ((previousValue as S)[itemKey] = value);

    return isMapType
      ? (previousValue as MapType<S>).get(itemKey)
      : (previousValue as S)[itemKey];
  }, firstLevelValue);

  /**
   * @description The prototype function proxies of the parent object of `Map` and `Set` have been updated.
   * At this point, it is necessary to remove the previous proxies for the prototype functions;
   * otherwise, subsequent read and write operations will not be able to access the latest proxied data.
   */
  // TODO waiting considering
  // applyOriginFunction && storeProxyMap.delete(
  //   (applyOriginFunction as ProxyTargetType)[__PROXY_TARGET_KEY_PREFIX__]
  // );
};
