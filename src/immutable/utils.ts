import { whatsType, typeString } from "../utils";
import type { PrimitiveState } from "../types";
import type {
  ApplyOriginFunctionType, ArrayLikeIteratorsType, CreateProxyType,
  KeyChainsSourceItemType, ProxyableType, ArrayMapSetIteratorType,
} from "./types";
import { __ITERATOR_META_PROCESSING_KEY__ } from "./static";

const proxyableSet = new Set(["Object", "Array", "Map"]);

export const proxyable = (value: unknown): boolean => {
  return proxyableSet.has(whatsType(value));
};

// A collection of functions that can be executed by proxies for arrays, Maps, and Set prototype chains.
const arrayMapSetPrototypeProxyableSet = new Set<ApplyOriginFunctionType>()
  // array
  .add(Array.prototype.forEach)
  .add(Array.prototype.map)
  .add(Array.prototype.filter)
  .add(Array.prototype.find)
  .add(Array.prototype.findIndex)
  .add(Array.prototype.findLast)
  .add(Array.prototype.findLastIndex)
  .add(Array.prototype.every)
  .add(Array.prototype.some)
  .add(Array.prototype.flatMap)
  .add(Array.prototype.flat)
  .add(Array.prototype.push)
  .add(Array.prototype.pop)
  .add(Array.prototype.fill)
  .add(Array.prototype.reverse)
  .add(Array.prototype.toReversed)
  .add(Array.prototype.shift)
  .add(Array.prototype.unshift)
  .add(Array.prototype.sort)
  .add(Array.prototype.toSorted)
  .add(Array.prototype.splice)
  .add(Array.prototype.copyWithin)
  .add(Array.prototype.at)
  .add(Array.prototype.values)
  .add(Array.prototype.concat)
  .add(Array.prototype.entries)
  .add(Array.prototype.reduce)
  .add(Array.prototype.reduceRight)
  .add(Array.prototype.slice)
  .add(Array.prototype.with)
  // map
  .add(Map.prototype.get)
  .add(Map.prototype.clear)
  .add(Map.prototype.delete)
  .add(Map.prototype.set)
  .add(Map.prototype.forEach)
  .add(Map.prototype.values)
  .add(Map.prototype.entries);

export const isArrayMapSetPrototypeProxyable = (value: any): boolean => {
  return arrayMapSetPrototypeProxyableSet.has(value);
};

/**
 * @description Create a new reference type data value with the same content based on the given reference type data.
 * Here, a few of the more common and widely used data types within the ComplexValueType are handled.
 */
export const createNewRefValue = <T>(value: T): T => {
  const type = typeString.call(value);
  switch (type) {
    case "[object Object]":
      // Using `new Object(value)`, its reference will not change.
      return Object.assign({}, value);
    case "[object Array]":
      return (value as unknown[]).slice() as T;
    case "[object Map]":
      return new Map(value as Iterable<readonly [unknown, unknown]>) as T;
    // TODO waiting develop
    // case "[object Set]":
    //   return new Set(value as Iterable<unknown>) as T;
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
  iterator: ArrayLikeIteratorsType<S>,
  parentTarget: ProxyableType<S>,
  createProxy: CreateProxyType<S>,
  firstLevelKey?: keyof S,
  keyChains?: Set<KeyChainsSourceItemType<S>>,
  applyOriginFunction?: ApplyOriginFunctionType,
  toReversedFlag?: boolean,
  entriesFlag?: boolean,
) => {
  // If it has already been processed, return directly
  if (iterator[__ITERATOR_META_PROCESSING_KEY__]) return;

  const type = whatsType(iterator);

  const AMS_IteratorFlag = type === "ArrayIterator" || type === "MapIterator";

  if (type === "Array" || AMS_IteratorFlag) {
    const keys = type === "MapIterator" ? parentTarget.keys().toArray() : null;
    const iteratorArray = AMS_IteratorFlag
      ? (iterator as any as ArrayMapSetIteratorType<S>).toArray()
      : iterator;

    // Does not affect the primitive iterators on the prototype chain (prototype [Symbol. iterator])
    iterator[Symbol.iterator] = () => {
      // Index and conditional processing for toReversed method
      let index = !toReversedFlag ? -1 : iteratorArray.length;

      return {
        next() {
          !toReversedFlag ? index++ : index--;

          const condition = !toReversedFlag ? index < iteratorArray.length : index >= 0;

          if (condition) {
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
    AMS_IteratorFlag && (iterator.next = iterator[Symbol.iterator]().next);
    // Mark processed
    iterator[__ITERATOR_META_PROCESSING_KEY__] = true;
  }
};
