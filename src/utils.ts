import type { PrimitiveState, MapType, NativeDataType } from "./types";

export const hasOwnProperty = Object.prototype.hasOwnProperty;

export const toString = Object.prototype.toString;

/** Track the shallow-cloned state map */
export const followUpMap = <K, V>(map: Map<K, V>) => {
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
export const objectToMap = <S extends PrimitiveState>(object: S) => Object.keys(object)
  .reduce((prev, key) => {
    prev.set(key, object[key]);
    return prev;
  }, new Map());

/** clear object */
export const clearObject = <S extends PrimitiveState>(object: S) => {
  Object.keys(object).forEach(key => {
    delete object[key];
  });
};

/** Identifying what type of data */
export const whatsType = (value: unknown): NativeDataType => {
  const typeString = toString.call(value);
  switch (typeString) {
    case "[object Number]":
      return "Number";
    case "[object String]":
      return "String";
    case "[object Boolean]":
      return "Boolean";
    case "[object Undefined]":
      return "Undefined";
    case "[object Null]":
      return "Null";
    case "[object Object]":
      return "Object";
    case "[object Array]":
      return "Array";
    case "[object Function]":
      return "Function";
    case "[object Date]":
      return "Date";
    case "[object Set]":
      return "Set";
    case "[object Map]":
      return "Map";
    case "[object Symbol]":
      return "Symbol";
    case "[object WeakSet]":
      return "WeakSet";
    case "[object WeakMap]":
      return "WeakMap";
    case "[object RegExp]":
      return "RegExp";
    case "[object BigInt]":
      return "BigInt";
    case "[object WeakRef]":
      return "WeakRef";
    case "[object Window]":
      return "Window";
    case "[object Global]":
      return "Global";
    default:
      return "Unknown";
  }
};
