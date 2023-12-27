import type { PrimitiveState } from "../types";
import type { ClassStoreType } from "./types";
import { storeErrorHandle } from "../errors";
import { CONNECT_SYMBOL_KEY, CLASS_STATE_REF_SET_KEY } from "../static";

/**
 * @description This proxy returned by constructor
 */
export function getThisProxy(this: any) {
  return new Proxy(this, {
    get(target, prop, receiver) {
      if (prop === "componentWillUnmount") {
        // If the subclass executes an overridden componentWillUnmount,
        // then it will be detected and then judged and executed
        if (!target.unmountExecuted) {
          target.unmountHandle();
        }
      }
      return Reflect.get(target, prop, receiver);
    },
  });
}

/** The core implementation of connectStore */
export function connectStoreCore<S extends PrimitiveState>(this: any, store: S) {
  storeErrorHandle(store, "connectStore");
  // Transform the called object to get this pointer of class,
  // in order to facilitate subsequent operations on class
  this[CONNECT_SYMBOL_KEY] = store[CONNECT_SYMBOL_KEY as keyof S];
  return this[CONNECT_SYMBOL_KEY]!() as ClassStoreType<S>;
}

/** The core implementation of unmountHandle */
export function unmountHandleCore(this: any) {
  this[CLASS_STATE_REF_SET_KEY]?.clear();
}
