import { whatsType, typeString, slice } from "../utils";
import type { PrimitiveState } from "../types";
import type {
  ApplyOriginFunctionType, IteratorsType, CreateProxyType,
  KeyChainsSourceItemType, ArrayMapSetIteratorType, IteratorsParentType, ProxyTargetType,
} from "./types";
import { __ITERATOR_META_PROCESSING_KEY__, __PROXY_TARGET_KEY_PREFIX__ } from "./static";

const proxyableSet = new Set(["Object", "Array", "Map", "Set"]);

export const proxyable = (value: unknown): boolean => {
  return proxyableSet.has(whatsType(value));
};

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

export const isMapSetPrototypeProxyable = (value: any): boolean => {
  return mapSetPrototypeProxyableSet.has(value);
};

/**
 * @description Create a new reference type data value with the same content based on the given reference type data.
 * Here, a few of the more common and widely used data types within the ComplexValueType are handled.
 */
export const createNewRefValue = <T>(value: T, keyLevel = 1): T => {
  const type = typeString.call(value);
  switch (type) {
    case "[object Object]":
      return Object.assign({}, value);
    case "[object Array]":
      return slice.call(value as unknown[]) as T;
    case "[object Map]": {
      const res =  new Map(value as Iterable<readonly [unknown, unknown]>) as T;
      (res as ProxyTargetType)[`${__PROXY_TARGET_KEY_PREFIX__}${keyLevel}`] = Symbol();
      return res;
    }
    case "[object Set]": {
      const res = new Set(value as Iterable<unknown>) as T;
      (res as ProxyTargetType)[`${__PROXY_TARGET_KEY_PREFIX__}${keyLevel}`] = Symbol();
      return res;
    }
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
                      (keyLevel ?? 1) + 1,
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
                    (keyLevel ?? 1) + 1,
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
