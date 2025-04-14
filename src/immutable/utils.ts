import type { ArrayPrototypeProxyableValueType } from "./types";
import { whatsType, typeString } from "../utils";

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
