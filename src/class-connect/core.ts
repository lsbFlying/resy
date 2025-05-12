import type { ClassInstanceTypeOfConnectStore, ClassStoreType } from "./types";
import type { AnyFn, PrimitiveState } from "../types";
import type { Store } from "../store/types";
import StoreMeta from "../store/store";
import {
  __CLASS_THIS_POINTER_STORES_KEY__, __CLASS_STATE_REF_SET_KEY__, __CLASS_IS_MOUNTED_KEY__,
} from "./static";
import { storeErrorProcessing } from "../store/errors";
import { hasOwnProperty } from "../utils";

export const constructorProcessing = <S extends PrimitiveState>(thisArg: ClassInstanceTypeOfConnectStore<S>) => {
  const instanceMounted = thisArg.componentDidMount;

  thisArg.componentDidMount = () => {
    instanceMounted?.apply(thisArg);
    /**
     * @description Previously,
     * the `isMounted` method from the `updater` object of React's class instances was used to determine component state.
     * However, React removed this method in later versions,
     * and now a new custom approach is used for update detection.
     */
    thisArg[__CLASS_IS_MOUNTED_KEY__] = true;
  };

  /**
   * @description First, extract the componentWillUnmount method from the child class instance,
   * then reassign a new componentWillUnmount method logic to the instance.
   * At the same time, the logic code of the extracted
   * child class instance's componentWillUnmount can be executed within the new logic.
   */
  const instanceUnmount = thisArg.componentWillUnmount;

  /**
   * @description Mounting a method on the component instance allows the subclass
   * to access componentWillUnmount again when it runs for this purpose in strict mode,
   * while writing a public 'componentWillUnmount' instance method in the class does not achieve this effect.
   */
  thisArg.componentWillUnmount = () => {
    thisArg[__CLASS_IS_MOUNTED_KEY__] = false;

    // The original 'this' pointing cannot be missing
    instanceUnmount?.apply(thisArg);
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
      if (!thisArg[__CLASS_IS_MOUNTED_KEY__]) {
        // Clear the data references used by the class component in rendering
        thisArg[__CLASS_STATE_REF_SET_KEY__].clear();
        // References to these data are recorded and added through “#connectClass”
        thisArg[__CLASS_THIS_POINTER_STORES_KEY__].forEach((store: Store<S>) => {
          /**
           * After the class component is unmounted and its internal data references are cleared,
           * the unmount logic of the class component is executed
           * The logic is divided into two parts:
           * firstly, removing this proxy instance of class from the internal classInstanceStack of the store,
           * and secondly, resetting the data to it`s initial state
           */
          (store as any as StoreMeta<S>)._classInstanceStack_.delete(thisArg);
          (store as any as StoreMeta<S>)._deferRestoreProcessing_();
        });
      }
    });
  };
};

const connectClass = <S extends PrimitiveState>(
  thisArg: ClassInstanceTypeOfConnectStore<S>,
  store: StoreMeta<S>,
  key: keyof S
) => {
  // In class, Set is used for reference tags and combined with the size attribute of Set to judge.
  thisArg[__CLASS_STATE_REF_SET_KEY__].add(key);
  return store.$state[key];
};

export const connectStoreCore = <S extends PrimitiveState>(
  thisArg: ClassInstanceTypeOfConnectStore<S>,
  store: Store<S>,
) => {
  storeErrorProcessing(store, "connectStore");
  (store as any as StoreMeta<S>)._initialStateRetrieve_();
  thisArg[__CLASS_THIS_POINTER_STORES_KEY__].add(store);

  (store as any as StoreMeta<S>)._classInstanceStack_.add(thisArg);

  // Data agents for use by class components
  const classEngineStore = new Proxy({} as S, {
    get: (_: S, key: keyof S) => {
      // Compatible with scenarios where both hook components and class components are used together.
      if (key === "useStore") return () => classEngineStore;

      const sourceFromThis = hasOwnProperty.call(StoreMeta, key);

      const value = (store as any as StoreMeta<S>).$state[key];

      return !sourceFromThis
        ? (
          typeof value !== "function"
            ? connectClass(thisArg, store as any as StoreMeta<S>, key)
            // Invoke a function data hook to grant the ability to update and render function data.
            : (...args: any[]) => (
              connectClass(thisArg, store as any as StoreMeta<S>, key) as AnyFn
            ).apply(classEngineStore, args)
        )
        : (store as any as StoreMeta<S>)[key as keyof StoreMeta<S>];
    },
  } as ProxyHandler<S>);

  return classEngineStore as ClassStoreType<S>;
};
