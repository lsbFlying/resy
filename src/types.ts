export type Callback = () => void;

export type PrimitiveState = Record<number | string, any>;

export type AnyFn = (...args: unknown[]) => unknown;

export type ValueOf<S extends PrimitiveState> = S[keyof S];

export type MapType<S extends PrimitiveState> = Map<keyof S, ValueOf<S>>;

export type NativeDataType =
  | "Number" | "String" | "Boolean" | "Undefined" | "Null" | "Symbol"
  | "Object" | "Function" | "Array" | "Date" | "RegExp"
  | "Map" | "Set" | "WeakMap" | "WeakSet"
  | "WeakRef" | "BigInt"
  | "Window" | "Global"
  | "Unknown";
