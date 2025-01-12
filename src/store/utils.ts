import type { PrimitiveState, MapType } from "../types";
import { whatsType, typeString } from "../utils";

/** Track the shallow-cloned state map */
export const shallowCloneMap = <K, V>(map: Map<K, V>) => {
  const mapTemp: Map<K, V> = new Map();
  map.forEach((value, key) => {
    mapTemp.set(key, value);
  });
  return mapTemp;
};

/** map to object */
export const mapToObject = <S extends PrimitiveState>(map: MapType<S>): S => {
  const object = {} as S;
  for (const [key, value] of map) {
    object[key] = value;
  }
  return object;
};

/** object to map */
export const objectToMap = <S extends PrimitiveState>(object: S) => {
  return Object.keys(object).reduce(
    (prev, key) => {
      prev.set(key, object[key]);
      return prev;
    },
    new Map(),
  );
};

// TODO 针对Map、Set类型待开发，目前先支持纯对象以及数组类型
// Currently handling two simple types of chainable updates: objects and arrays
const proxyableSet = new Set(["Object", "Array"]);

export const proxyable = (value: unknown): boolean => {
  return proxyableSet.has(whatsType(value));
};

const primitiveSet = new Set(["Number", "String", "Boolean", "Undefined", "Null", "Symbol"]);

export const isPrimitive = (value: unknown): boolean => {
  return primitiveSet.has(whatsType(value));
};

/**
 * @description Create a new reference type data value with the same content based on the given reference type data.
 * Here, a few of the more common and widely used data types within the ComplexValueType are handled.
 */
export const createNewValue = <T>(value: T): T => {
  const type = typeString.call(value);
  switch (type) {
    case "[object Object]":
      // Using `new Object(value)`, its reference will not change.
      return Object.assign({}, value);
    case "[object Array]":
      return (value as unknown[]).slice() as T;
    /** TODO 后续的类型待开发 */
    case "[object Set]":
      return new Set(value as Iterable<unknown>) as T;
    case "[object Map]":
      return new Map(value as Iterable<readonly [unknown, unknown]>) as T;
    default:
      return value;
  }
};
