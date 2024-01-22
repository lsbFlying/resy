import type { NativeDataType } from "./types";

export const hasOwnProperty = Object.prototype.hasOwnProperty;

const typeString = Object.prototype.toString;

/** Identifying what type of data */
export const whatsType = (value: unknown): NativeDataType => {
  switch (typeString.call(value)) {
    case "[object Object]":
      return "Object";
    case "[object Undefined]":
      return "Undefined";
    case "[object Array]":
      return "Array";
    case "[object Function]":
      return "Function";
    case "[object Number]":
      return "Number";
    case "[object String]":
      return "String";
    case "[object Boolean]":
      return "Boolean";
    case "[object Null]":
      return "Null";
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
