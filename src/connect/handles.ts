import type { PrimitiveState } from "../types";
import type { ClassStoreType } from "./types";
import type { Store } from "../store/types";
import { storeErrorHandle } from "../store/errors";
import {
  __CONNECT_SYMBOL_KEY__, __STORES_KEY__, __CLASS_UNMOUNT_HANDLE_KEY__, __CLASS_FN_INITIAL_HANDLE_KEY__,
} from "./static";

// The core implementation of connectStore
export function connectStoreCore<S extends PrimitiveState>(this: any, store: S) {
  storeErrorHandle(store, "connectStore");
  store[__CLASS_FN_INITIAL_HANDLE_KEY__ as keyof S]();
  this[__STORES_KEY__].add(store);
  // Transform the called object to get this pointer of class,
  // in order to facilitate subsequent operations on class
  this[__CONNECT_SYMBOL_KEY__] = store[__CONNECT_SYMBOL_KEY__ as keyof S];
  return this[__CONNECT_SYMBOL_KEY__]!() as ClassStoreType<S>;
}

// this proxy returned by constructor
export function getThisProxy(this: any) {
  return new Proxy(this, {
    get(target, prop, receiver) {
      if (prop === "componentWillUnmount") {
        // Ensure that the unmount logic is executed
        if (!target.unmountExecuted) {
          // Ensure that this points to the proxy instance here in order to facilitate the subsequent unmount execution.
          Reflect.get(target, "unmountHandle", receiver).bind(receiver)();
        }
      }
      // In order to ensure that connectStore can be executed correctly even if the child subclass is incorrectly overwritten,
      // interception is performed here to return the correct executable connection function
      if (prop === "connectStore") {
        return <S extends PrimitiveState>(store: S) => connectStoreCore.bind(receiver)(store);
      }
      return Reflect.get(target, prop, receiver);
    },
  });
}

// The core implementation of unmountHandle
export function unmountHandleCore<S extends PrimitiveState>(this: any) {
  // Clear the data references used by the class component in rendering
  // References to these data are recorded and added through “connectClassUse”
  this[__STORES_KEY__].forEach((store: Store<S>) => {
    /**
     * After the class component is uninstalled and its internal data references are cleared,
     * the unmount logic of the class component is executed
     * The logic is divided into two parts:
     * firstly, removing the this proxy instance of class from the internal classThisPointerSet of the store,
     * and secondly, resetting the data to it`s initial state
     */
    store[__CLASS_UNMOUNT_HANDLE_KEY__ as keyof S].bind(this)();
  });
}
