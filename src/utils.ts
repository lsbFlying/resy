import type {
  NativeDataType,
  // PrimitiveValueType,
} from "./types";

export const hasOwnProperty = Object.prototype.hasOwnProperty;

export const typeString = Object.prototype.toString;

/** Identifying what type of data */
export const whatsType = (value: unknown): NativeDataType => {
  const type = typeString.call(value);
  switch (type) {
    case "[object String]":
      return "String";
    case "[object Number]":
      return "Number";
    case "[object Boolean]":
      return "Boolean";
    case "[object Object]":
      return "Object";
    case "[object Array]":
      return "Array";
    case "[object Set]":
      return "Set";
    case "[object Map]":
      return "Map";
    case "[object Function]":
      return "Function";
    case "[object Date]":
      return "Date";
    case "[object Symbol]":
      return "Symbol";
    case "[object WeakSet]":
      return "WeakSet";
    case "[object WeakMap]":
      return "WeakMap";
    case "[object RegExp]":
      return "RegExp";
    case "[object WeakRef]":
      return "WeakRef";
    case "[object BigInt]":
      return "BigInt";
    case "[object Null]":
      return "Null";
    case "[object Undefined]":
      return "Undefined";

    case "[object Promise]":
      return "Promise";
    case "[object AsyncFunction]":
      return "AsyncFunction";
    case "[object Array Iterator]":
      return "Array Iterator";
    case "[object FormData]":
      return "FormData";
    case "[object Blob]":
      return "Blob";
    case "[object File]":
      return "File";
    case "[object Error]":
      return "Error";
    case "[object CustomEvent]":
      return "CustomEvent";
    case "[object Storage]":
      return "Storage";

    case "[object WebSocket]":
      return "WebSocket";
    case "[object ArrayBuffer]":
      return "ArrayBuffer";
    case "[object DataView]":
      return "DataView";
    case "[object Uint8Array]":
      return "Uint8Array";
    case "[object Int8Array]":
      return "Int8Array";
    case "[object Uint8ClampedArray]":
      return "Uint8ClampedArray";
    case "[object Int16Array]":
      return "Int16Array";
    case "[object Uint16Array]":
      return "Uint16Array";
    case "[object Int32Array]":
      return "Int32Array";
    case "[object Uint32Array]":
      return "Uint32Array";
    case "[object Float32Array]":
      return "Float32Array";
    case "[object Float64Array]":
      return "Float64Array";
    case "[object BigInt64Array]":
      return "BigInt64Array";
    case "[object BigUint64Array]":
      return "BigUint64Array";
    case "[object XMLHttpRequest]":
      return "XMLHttpRequest";
    case "[object Headers]":
      return "Headers";
    case "[object Request]":
      return "Request";
    case "[object Response]":
      return "Response";

    case "[object Window]":
      return "Window";
    case "[object Global]":
      return "Global";
    case "[object global]":
      return "Global";
    case "[object Arguments]":
      return "Arguments";
    default:
      // Other type, for-example: [object HTMLElement]
      return type?.match(/\[object\s+(.*?)]/)?.[1] as NativeDataType;
  }
};

// const primitiveMap = new Map<PrimitiveValueType, PrimitiveValueType>(Object.entries({
//   Number: "Number",
//   String: "String",
//   Boolean: "Boolean",
//   Undefined: "Undefined",
//   Null: "Null",
//   Symbol: "Symbol",
// }) as any);

// export const isPrimitive = (value: unknown): boolean => {
//   return primitiveMap.has(whatsType(value) as PrimitiveValueType);
// };
