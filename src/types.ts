export type Callback = () => void;

export type PrimitiveState = Record<number | string, any>;

export type AnyFn = (...args: unknown[]) => unknown;

export type ValueOf<S extends PrimitiveState> = S[keyof S];

export type MapType<S extends PrimitiveState> = Map<keyof S, ValueOf<S>>;

export type PrimitiveValueType = "Number" | "String" | "Boolean" | "Undefined" | "Null" | "Symbol";

export type ComplexValueType =
  | "Object" | "Function" | "Array" | "Date" | "RegExp"
  | "Map" | "Set" | "WeakMap" | "WeakSet"
  | "WeakRef" | "BigInt" | "Arguments"
  | "Promise" | "AsyncFunction" | "Array Iterator" | "FormData" | "Blob" | "File" | "Error"
  | "CustomEvent" | "Storage"
  | "WebSocket" | "ArrayBuffer" | "DataView"
  | "Uint8Array" | "Int8Array" | "Uint8ClampedArray" | "Int16Array" | "Uint16Array" | "Int32Array"
  | "Uint32Array" | "Float32Array" | "Float64Array" | "BigInt64Array" | "BigUint64Array"
  | "XMLHttpRequest" | "Headers" | "Request" | "Response"
  | "Window" | "Global";

export type NativeDataType = PrimitiveValueType | ComplexValueType;
