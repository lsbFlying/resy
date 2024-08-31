import type { ClassInstanceTypeOfConnectStore, ClassStoreType } from "./types";
import type { PrimitiveState, AnyFn } from "../types";
import type { ConciseStoreCore, Store } from "../store/types";
import {
  __CLASS_THIS_POINTER_STORES_KEY__, __CLASS_CONNECT_STORE_KEY__,
  __CLASS_INITIAL_STATE_RETRIEVE_KEY__, __CLASS_STATE_REF_SET_KEY__,
  __CLASS_UNMOUNT_PROCESSING_KEY__,
} from "./static";
import { storeErrorProcessing } from "../store/errors";

export function constructorProcessing<S extends PrimitiveState>(this: ClassInstanceTypeOfConnectStore<S>) {
  /**
   * @description First, extract the componentWillUnmount method from the child class instance,
   * then reassign a new componentWillUnmount method logic to the instance.
   * At the same time, the logic code of the extracted
   * child class instance's componentWillUnmount can be executed within the new logic.
   */
  const instanceUnmount = this.componentWillUnmount;
  /**
   * @description Mounting a method on the component instance allows the subclass
   * to access componentWillUnmount again when it runs for this purpose in strict mode,
   * while writing a public 'componentWillUnmount' instance method in the class does not achieve this effect.
   */
  this.componentWillUnmount = () => {
    instanceUnmount?.();
    /**
     * @description The strict mode of class components does not provide accurate predictability
     * and safety guarantees for the execution of component lifecycles.
     * In strict mode, it calls the unmount function once after the second mount execution,
     * using the second component instance for the call.
     * This leads to confusion between the internal unmount logic and the component instance.
     * Therefore, delayed execution is necessary here to avoid confusion.
     * After the delay, it checks whether the component is still in the process of mounting
     * to determine if it's a real unmount or a fake unmount caused by strict mode.
     */
    Promise.resolve().then(() => {
      if (!this.updater.isMounted(this)) {
        // Clear the data references used by the class component in rendering
        this[__CLASS_STATE_REF_SET_KEY__].clear();
        // References to these data are recorded and added through “connectClass”
        this[__CLASS_THIS_POINTER_STORES_KEY__].forEach((store: Store<S>) => {
          /**
           * After the class component is unmounted and its internal data references are cleared,
           * the unmount logic of the class component is executed
           * The logic is divided into two parts:
           * firstly, removing this proxy instance of class from the internal classThisPointerSet of the store,
           * and secondly, resetting the data to it`s initial state
           */
          (store[__CLASS_UNMOUNT_PROCESSING_KEY__ as keyof S] as AnyFn).apply(this);
        });
      }
    });
  };
}

export function connectStoreCore<S extends PrimitiveState>(
  this: ClassInstanceTypeOfConnectStore<S>,
  store: Store<S> | ConciseStoreCore<S>,
): ClassStoreType<S> {
  storeErrorProcessing(store, "connectStore");
  store[__CLASS_INITIAL_STATE_RETRIEVE_KEY__ as keyof S]();
  this[__CLASS_THIS_POINTER_STORES_KEY__].add(store);
  // Transform the called object to get this pointer of class,
  // in order to facilitate subsequent operations on class
  this[__CLASS_CONNECT_STORE_KEY__] = store[__CLASS_CONNECT_STORE_KEY__ as keyof S];
  return this[__CLASS_CONNECT_STORE_KEY__]!();
}
