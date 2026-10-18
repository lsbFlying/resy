export type Callback = () => void;

export type PrimitiveState = Record<PropertyKey, any>;

export type AnyFn = (...args: any[]) => any;

export type ValueOf<S extends PrimitiveState> = S[keyof S];

export type MapType<S extends PrimitiveState> = Map<keyof S, ValueOf<S>>;

export type PrimitiveValueType = "Number" | "String" | "Boolean" | "Undefined" | "Null" | "Symbol";

export type ComplexValueType =
  | "Object" | "Function" | "Array" | "Date" | "RegExp"
  | "Map" | "Set" | "WeakMap" | "WeakSet"
  | "Array Iterator" | "Set Iterator" | "Map Iterator"
  | "WeakRef" | "BigInt" | "Arguments"
  | "Promise" | "AsyncFunction" | "FormData" | "Blob" | "File" | "Error"
  | "CustomEvent" | "Storage"
  | "WebSocket" | "ArrayBuffer" | "DataView"
  | "Uint8Array" | "Int8Array" | "Uint8ClampedArray" | "Int16Array" | "Uint16Array" | "Int32Array"
  | "Uint32Array" | "Float32Array" | "Float64Array" | "BigInt64Array" | "BigUint64Array"
  | "XMLHttpRequest" | "Headers" | "Request" | "Response"
  | "Window" | "Global";

export type NativeDataType = PrimitiveValueType | ComplexValueType;

/**
 * @description Recursively mark a state shape as read-only at the type level.
 *
 * It is used for objects handed out as historical snapshots (`prevState`,
 * `nextState`, `effectState`, updater `prevState`): mutating those objects must
 * not compile, because at runtime they are raw references that would rewrite
 * the current tree or the history instead of committing through the store.
 *
 * 🌟 Type-only: it does not wrap anything at runtime. JavaScript callers can
 * still mutate the raw objects; a runtime guard (if any) is a separate concern.
 *
 * Design notes:
 * - functions stay callable (state actions are still usable);
 * - `Map` keys are not made deeply read-only: keys are usually primitives and
 *   deep-reading them would only complicate `get`'s type matching;
 * - arrays become `ReadonlyArray`, which removes the mutating methods from the
 *   type (tuples collapse to a union array — acceptable for state data);
 * - `Date` / `RegExp` are kept as-is: their mutators live on the prototype and
 *   a mapped type would be structurally odd without actually blocking them.
 */
export type DeepReadonly<T> =
  T extends (...args: any[]) => any ? T
  : T extends ReadonlyMap<infer K, infer V> ? ReadonlyMap<K, DeepReadonly<V>>
  : T extends ReadonlySet<infer V> ? ReadonlySet<DeepReadonly<V>>
  : T extends readonly (infer V)[] ? ReadonlyArray<DeepReadonly<V>>
  : T extends Date | RegExp ? T
  : T extends object ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;
