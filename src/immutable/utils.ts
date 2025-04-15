import { whatsType, typeString } from "../utils";
import type { PrimitiveState } from "../types";
import type {
  ArrayPrototypeProxyableValueType, CreateProxyType, KeyChainsSourceItemType,
} from "./types";

const proxyableSet = new Set(["Object", "Array", "Map"]);

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
  .add(Array.prototype.push)
  .add(Array.prototype.pop)
  .add(Array.prototype.fill)
  .add(Array.prototype.reverse)
  .add(Array.prototype.shift)
  .add(Array.prototype.unshift)
  .add(Array.prototype.sort)
  .add(Array.prototype.splice)
  .add(Array.prototype.copyWithin)
  .add(Array.prototype.at)
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

export const iteratorProcessing = <S extends PrimitiveState>(
  target: any[],
  parentTarget: any[],
  createProxy: CreateProxyType<S>,
  firstLevelKey?: keyof S,
  keyChains?: Set<KeyChainsSourceItemType<S>>,
) => {
  // TODO 暂时先考虑简单的数组类型（以便于满足数组的"..."扩展运算符），可能还涉及Iterator类型，waiting develop ...
  if (whatsType(target) === "Array") {
    // @ts-ignore
    target[Symbol.iterator] = () => {
      let index = -1;
      return {
        next() {
          index++;
          return index < (target as any[])?.length
            ? {
              done: false,
              value: createProxy(
                (target as any[])?.[index],
                parentTarget,
                firstLevelKey,
                new Set(keyChains).add({ key: index }),
              ),
            }
            : { done: true };
        }
      };
    };
  }
};
