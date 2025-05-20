import type { AnyFn, PrimitiveState, ValueOf } from "../types";
import type { AnyBoundFn, Store } from "../store/types";
import type { ClassStoreType } from "./types";
import { PureComponent } from "react";
import { storeErrorProcessing } from "../store/errors";
import { hasOwnProperty } from "../utils";
import { __DEV__ } from "../static";
import StoreMeta from "../store/core";

/**
 * @class ComponentWithStore
 * @classdesc The public base class can connect to the store
 */
export class ComponentWithStore<
  P extends PrimitiveState = {},
  S extends PrimitiveState = {},
  SS = any,
> extends PureComponent<P, S, SS> {
  constructor(props: P) {
    super(props);
    if (__DEV__ && new.target === ComponentWithStore) {
      throw new Error("This class cannot be instantiated.");
    }
    this.#constructorProcessing();
  }

  static displayName?: string;

  _$isMounted_ = false;

  _$stateRecords_ = new Set<keyof S>();

  /**
   * @description Class components may use multiple different stores.
   * These store references are collected into `#stores` for subsequent use.
   */
  #stores: Set<Store<S>> = new Set();

  #constructorProcessing = () => {
    const instanceMounted = this.componentDidMount;

    this.componentDidMount = () => {
      instanceMounted?.apply(this);
      /**
       * @description Previously,
       * the `isMounted` method from the `updater` object of React's class instances was used to determine component state.
       * However, React removed this method in later versions,
       * and now a new custom approach is used for update detection.
       */
      this._$isMounted_ = true;
    };

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
      this._$isMounted_ = false;

      // The original 'this' pointing cannot be missing
      instanceUnmount?.apply(this);
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
        if (!this._$isMounted_) {
          // Clear the data references used by the class component in rendering
          this._$stateRecords_.clear();
          // References to these data are recorded and added through “#connectClass”
          this.#stores.forEach((store: Store<S>) => {
            /**
             * After the class component is unmounted and its internal data references are cleared,
             * the unmount logic of the class component is executed
             * The logic is divided into two parts:
             * firstly, removing this proxy instance of class from the internal classInstanceStack of the store,
             * and secondly, resetting the data to it`s initial state
             */
            (store as any as StoreMeta<S>)._classInstanceStack_.delete(this);
            (store as any as StoreMeta<S>)._restorer_.deferRestoreProcessing();
          });
        }
      });
    };
  };

  #connectClass = <S extends PrimitiveState>(
    key: keyof S,
    store: StoreMeta<S>,
  ) => {
    this._$stateRecords_.add(key as (string | number));
    return store.$state[key];
  };

  connectStore = <S extends PrimitiveState>(store: Store<S>) => {
    storeErrorProcessing(store, "connectStore");
    (store as any as StoreMeta<S>)._restorer_.initialStateRetrieve();
    this.#stores.add(store as any);

    (store as any as StoreMeta<S>)._classInstanceStack_.add(this as any);

    const {
      _options_: {
        __enableMacros__,
        enableMarcoActionStateful,
      },
    } = (store as any as StoreMeta<S>);

    // Data agents for use by class components
    const classEngineStore = new Proxy({} as ClassStoreType<S>, {
      get: (_: S, key: keyof S) => {
        // Compatible with scenarios where both hook components and class components are used together.
        if (key === "useStore") return () => classEngineStore;

        const sourceFromThis = hasOwnProperty.call(StoreMeta, key);

        const value = (store as any as StoreMeta<S>).$state[key];

        if (!sourceFromThis && typeof value !== "function") {
          return this.#connectClass(key, store as any as StoreMeta<S>);
        }

        if (!sourceFromThis && typeof value === "function") {
          !(value as AnyBoundFn).__bound__
          && (store as any as StoreMeta<S>)._boundFnProcessing_(key, value, classEngineStore);

          // TODO waiting upgrade about memo-function
          return (!__enableMacros__ || enableMarcoActionStateful)
            ? (...args: any[]) => (
              this.#connectClass(key, store as any as StoreMeta<S>) as AnyFn
            ).apply(classEngineStore, args)
            : (store as any as StoreMeta<S>).$state[key];
        }

        return (store as any as StoreMeta<S>)[key as keyof StoreMeta<S>];
      },
      // TODO classEngineStore可能需要递归代理生成proxy，像StoreMeta的createProxy方法那样，以便于链式更新
      set: (_: ClassStoreType<S>, key: keyof S, value: ValueOf<S>): boolean => {
        !Object.is((store as any as StoreMeta<S>).$state[key], value)
        && (store as any as StoreMeta<S>)._classUpdater_(key, value);
        return true;
      },
    } as ProxyHandler<ClassStoreType<S>>);

    return classEngineStore;
  };
}
