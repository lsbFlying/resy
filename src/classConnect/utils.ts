import type { PrimitiveState } from "../types";
import type { ClassStoreType } from "./types";
import type { Store, ClassThisPointerType } from "../store/types";
import { storeErrorProcessing } from "../store/errors";
import {
  __CLASS_CONNECT_STORE_KEY__, __CLASS_THIS_POINTER_STORES_KEY__, __CLASS_STATE_REF_SET_KEY__,
  __CLASS_UNMOUNT_PROCESSING_KEY__, __CLASS_INITIAL_STATE_RETRIEVE_KEY__,
} from "./static";

// The core implementation of connectStore
export function connectStoreCore<S extends PrimitiveState>(this: ClassThisPointerType<S>, store: S) {
  storeErrorProcessing(store, "connectStore");
  store[__CLASS_INITIAL_STATE_RETRIEVE_KEY__ as keyof S]();
  this[__CLASS_THIS_POINTER_STORES_KEY__].add(store);
  // Transform the called object to get this pointer of class,
  // in order to facilitate subsequent operations on class
  this[__CLASS_CONNECT_STORE_KEY__] = store[__CLASS_CONNECT_STORE_KEY__ as keyof S];
  return this[__CLASS_CONNECT_STORE_KEY__]!() as ClassStoreType<S>;
}

// this proxy returned by constructor
export function getThisProxy<T extends PrimitiveState>(this: ClassThisPointerType<T>) {
  // eslint-disable-next-line prefer-const
  return new Proxy(this, {
    get(target, prop, receiver) {
      if (prop === "componentWillUnmount") {
        // Ensure that the unmount logic is executed
        if (!target.unmountExecuted) {
          // Ensure that this points to the proxy instance here in order to facilitate the subsequent unmount execution.
          Reflect.get(target, "unmountProcessing", receiver).bind(receiver)();
        }
      }
      // In order to ensure that connectStore can be executed correctly even if the child subclass is incorrectly overwritten,
      // interception is performed here to return the correct executable connection function
      if (prop === "connectStore") {
        return <S extends PrimitiveState>(store: S) => connectStoreCore.bind(receiver)(store);
      }
      return Reflect.get(target, prop, receiver);
    },
  }) as any;
}

// The core implementation of unmountProcessing
export function unmountProcessingCore<S extends PrimitiveState>(this: ClassThisPointerType<S>) {
  // Clear the data references used by the class component in rendering
  this[__CLASS_STATE_REF_SET_KEY__].clear();
  // References to these data are recorded and added through “connectClassUse”
  this[__CLASS_THIS_POINTER_STORES_KEY__].forEach((store: Store<S>) => {
    /**
     * After the class component is unmounted and its internal data references are cleared,
     * the unmount logic of the class component is executed
     * The logic is divided into two parts:
     * firstly, removing the this proxy instance of class from the internal classThisPointerSet of the store,
     * and secondly, resetting the data to it`s initial state
     */
    store[__CLASS_UNMOUNT_PROCESSING_KEY__ as keyof S].bind(this)();
  });
}
