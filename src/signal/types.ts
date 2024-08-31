import type { NativeDataType, PrimitiveState } from "../types";
import type { EffectCallback } from "react";
import type { SetOptions, StoreCoreUtils } from "../store/types";
import { __SIGNAL_IDENTIFIER_KEY__ } from "./static";

/** @description meta attributes type of signal */
export interface SignalMeta<T> {
  /**
   * @description `value` is not considered an original method or property,
   * and it can be regarded as an approach for retrieving data values.
   * The only concern is that when naming state data properties,
   * it is necessary to avoid duplicating the name `value`.
   */
  value: T;
  /**
   * @description The data type of Signal itself is a complex object type,
   * which cannot accommodate operations involving operators that perform truthy or falsy calculations
   * such as `?`, `===`, `!==`, `&&`, `||`, `&==`, `||=`, `?`, `?=`, `!`.
   * It requires the assistance of APIs such as truthy or falsy to execute correctly.
   */
  truthy: boolean;
  /** @description As same as truthy */
  falsy: boolean;
  /**
   * typeOf function api
   * @description In order to adapt and compensate for the functionality of `typeof`,
   * here a more precise type is returned.
   * The naming of `typeOf` is more closely aligned with the naming concept of `valueOf`.
   * At the same time,
   * avoid conflicts with the type attribute of react element objects if named 'type'.
   */
  typeOf(): NativeDataType;
  /**
   * @description When `JSON.stringify` encounters an object that has a `toJSON` method, it will:
   * 1. Invoke the object's `toJSON` method.
   * 2. Use the return value of the `toJSON` method as the new target for serialization.
   * In other words, `JSON.stringify` will prioritize serializing the result
   * of the `toJSON` method instead of directly serializing the original object.
   */
  toJSON(): T;
  [__SIGNAL_IDENTIFIER_KEY__]: true;
  [Symbol.toPrimitive]: T;
  [Symbol.toStringTag]: T;
  [Symbol.iterator](): Iterator<T>;
}

export type Signal<T> = SignalMeta<T>
  & (
    T extends PrimitiveState
      ? T extends Function
        ? T
        : Signals<T>
      : T
  );

export type Signals<S extends PrimitiveState> = {
  [K in keyof S]: Signal<S[K]>;
};

// Unwrap the nested Signal generic type from the return type of the signal function.
export type UnwrapSignal<T> = T extends Signal<infer U>
  ? U
  : T extends Signal<infer A>[]
    ? A[]
    : T;

/**
 * @description Perform type abstraction for the hook from the signal,
 * indicating a clear separation.
 * Strive to demonstrate the intention that signal and hook should not be used interchangeally.
 */
export type SignalsUtils<S extends PrimitiveState> = StoreCoreUtils<S> & Readonly<SetOptions>;

/**
 * @description Rendering with the signal mode by extracting data from the signal's meta-data.
 * By distributing signals through the store's "signals" property as an entry point,
 * we maintain resy's consistent design philosophy.
 * This aligns with the concept of using destructuring
 * to access read functions through both useStore() and the store itself.
 * Essentially, destructuring function properties from the "signals" property enables rendering capabilities,
 * similar to how it works with useStore().
 * On the other hand, directly accessing function properties through the store
 * is purely for action execution and does not possess rendering capabilities.
 */
export interface SignalsType<S extends PrimitiveState> {
  signals: Signals<S> & SignalsUtils<S>;
}

export type SignalStoreCore<S extends PrimitiveState> = S & StoreCoreUtils<S> & SignalsType<S>;

export type SignalStore<S extends PrimitiveState> = S & SignalsUtils<S> & SignalsType<S>;

export interface SignalStoreHeart<S extends PrimitiveState> {
  readonly store: SignalStoreCore<S>;
}

export type UseSignalsReturnType<S extends PrimitiveState> = Signals<S> & StoreCoreUtils<S> & SignalStoreHeart<S>;

export type SignalMetaMapType<S extends PrimitiveState, T = any> = Map<keyof S, SignalMeta<T>>;

export type Destructor = () => void;

export type DestructorWithResult<T> = {
  destructor: Destructor;
  result: T;
};

/**
 * @param R "The 'R' generic being true (`R` extends `true`) is used internally.
 * External usage generally doesn't require explicitly setting the 'R' generic to true."
 */
export type SignalsEffectCallback<T = any, R extends boolean = false> =
  R extends true
    ? () => T
    : EffectCallback;

export type SignalsEffectReturnType<T, R extends boolean> = R extends true
  ? DestructorWithResult<T>
  : Destructor;

export type SignalsHookingComputingType = {
  computing: boolean;
};

export type SignalsEffectStoreKeysCollectingType = {
  collecting: boolean;
};

export type IteratorAbleType = {
  iteratorAble?: boolean;
} & Record<string, unknown>;

// export type Constructor<T> = new (...args: any[]) => T;

export type IteratorAbleTypeArgs = Map<any, any> | Set<any> | object | ArrayLike<any>;
