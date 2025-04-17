import { whatsType, typeString } from "../utils";
import type { PrimitiveState } from "../types";
import type {
  ArrayPrototypeProxyableValueType, CreateProxyType, KeyChainsSourceItemType,
} from "./types";

const proxyableSet = new Set(["Object", "Array", "Map", "ArrayIterator"]);

export const proxyable = (value: unknown): boolean => {
  return proxyableSet.has(whatsType(value));
};

// todo 数组、Map、Set原型链可以被代理执行的函数
const arrayMapSetPrototypeProxyableSet = new Set<ArrayPrototypeProxyableValueType>()
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
  .add(Map.prototype.get);

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
 */
export const iteratorProcessing = <S extends PrimitiveState>(
  target: ArrayLike<S>,
  parentTarget: any[],
  createProxy: CreateProxyType<S>,
  firstLevelKey?: keyof S,
  keyChains?: Set<KeyChainsSourceItemType<S>>,
  applyOriginFunction?: ArrayPrototypeProxyableValueType,
  toReversedFlag?: boolean,
  entriesFlag?: boolean,
) => {
  const type = whatsType(target);
  // TODO 目前先支持数组、数组迭代器类型
  if (type === "Array" || type === "ArrayIterator") {
    const iterators = type === "ArrayIterator"
      ? (target as any as ArrayIterator<S>).toArray()
      : target;

    // Does not affect the primitive iterators on the prototype chain (prototype [Symbol. iterator])
    // @ts-ignore
    target[Symbol.iterator] = () => {
      // Index and conditional processing for toReversed method
      let index = !toReversedFlag ? -1 : iterators?.length;

      return {
        next() {
          !toReversedFlag ? index++ : index--;

          const condition = !toReversedFlag ? index < iterators?.length : index >= 0;

          return condition
            ? {
              done: false,
              value: entriesFlag
                ? [
                  iterators?.[index][0],
                  createProxy(
                    iterators?.[index][1],
                    parentTarget,
                    firstLevelKey,
                    new Set(keyChains).add({ key: index }),
                    applyOriginFunction,
                  ),
                ]
                : createProxy(
                  iterators?.[index],
                  parentTarget,
                  firstLevelKey,
                  new Set(keyChains).add({ key: index }),
                  applyOriginFunction,
                ),
            }
            : { done: true };
        }
      };
    };
  }
};
