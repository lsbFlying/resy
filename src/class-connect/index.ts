import type { PrimitiveState, ValueOf } from "../types";
import type { AnyBoundFn, Store } from "../store/types";
import type { ClassStoreType } from "./types";
import { PureComponent } from "react";
import { storeErrorProcessing } from "../store/errors";
import { __COMPUTED_PREFIX__ } from "../store/static";
import StoreMeta from "../store/core";

/**
 * @class ComponentWithStore
 * @classdesc The public base class can connect to the store
 */
export abstract class ComponentWithStore<
  P extends PrimitiveState = {},
  S extends PrimitiveState = {},
  SS = any,
> extends PureComponent<P, S, SS> {
  constructor(props: P) {
    super(props);
    if (__DEV__ && new.target === ComponentWithStore) {
      throw new Error("This class cannot be instantiated.");
    }

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
          // Clear the computed subscription for class
          this.#computedSubscribers.forEach(abf => {
            abf.__unsubscribe__?.();
          });
          this.#computedSubscribers.clear();

          // Clear the data references used by the class component in rendering
          this._$stateRefs_.clear();

          // References to these data are recorded and added through “#connectClass”
          this.#stores.forEach((store: Store<S>) => {
            /**
             * After the class component is unmounted and its internal data references are cleared,
             * the unmount logic of the class component is executed
             * The logic is divided into two parts:
             * firstly, removing this proxy instance of class from the internal classInstanceStack of the store,
             * and secondly, resetting the data to it`s initial state
             */
            (store as any as StoreMeta<S>)._updater_.classInstanceStack.delete(this);
            (store as any as StoreMeta<S>)._restorer_.deferRestoreProcessing();
          });
        }
      });
    };
  }

  static displayName?: string;

  _$store_!: ClassStoreType<any>;

  /**
   * @desc The identification of whether the class component has been uninstalled
   * is mainly aimed at the dual rendering problem in strict mode.
   */
  _$isMounted_ = false;

  // Collection of records referenced by the state of class components
  _$stateRefs_ = new Set<keyof S>();

  // The collection of internal subscribers for the computed of class
  #computedSubscribers = new Set<AnyBoundFn>();

  /**
   * @description Class components may use multiple different stores.
   * These store references are collected into `#stores` for subsequent use.
   */
  #stores: Set<Store<S>> = new Set();

  #getState<S extends PrimitiveState>(key: keyof S, store: StoreMeta<S>) {
    this._$stateRefs_.add(key as (string | number));
    return store._$state_[key];
  };

  connectStore<S extends PrimitiveState>(store: Store<S>) {
    storeErrorProcessing(store, "connectStore");
    (store as any as StoreMeta<S>)._restorer_.initialStateRetrieve();
    this.#stores.add(store as any);

    const {
      _updater_: updater, _computer_: computer,
      hasOwnKey, _boundFnProcessing_,
    } = store as any as StoreMeta<S>;

    const { updateStateMeta, classInstanceStack } = updater;
    classInstanceStack.add(this as any as ComponentWithStore<P, S, SS>);

    const { computed, computedDeps } = computer;

    // Data agents for use by class components
    const classEngineStore = new Proxy({} as ClassStoreType<S>, {
      get: (_, key: keyof S) => {
        // TODO waiting upgrade
        // const sourceFrom$State = !firstLevelKey;
        // computer.computing && sourceFrom$State && computedDeps.add(key);
        if (computer.computing) {
          computedDeps.add(key);
          /**
           * @desc This ensures that even if a class component doesn't
           * directly use the state needed in computed, a state reference is tracked,
           * allowing the classUpdater to trigger proper re-renders.
           * 🌟 This implementation accounts for cases where the computed method
           * within the class could potentially read data through this.store:
           * @example
           * const { count, text } = this.store;
           * const countPro = computed(store, () => {
           *   console.log("computed");
           *   // The variable testCount is not destructured from this.store
           *   // in the assignment const { count, text } = this.store;
           *   return this.store.testCount * 2;
           * });
           */
          this._$stateRefs_.add(key as (string | number));
        }

        const sourceFromStore = hasOwnKey(key);
        const state = (store as any as StoreMeta<S>)._$state_;

        const value = state[key];

        if (!sourceFromStore && typeof value !== "function") {
          return this.#getState(key, store as any as StoreMeta<S>);
        }

        if (!sourceFromStore && typeof value === "function") {
          !(value as AnyBoundFn).__bound__
          && _boundFnProcessing_(key, value, classEngineStore);

          const boundFnValue = state[key];

          const isComputed = key.toString().startsWith(__COMPUTED_PREFIX__);
          if (isComputed) {
            this.#computedSubscribers.add(boundFnValue);
            return computed.bind(null, boundFnValue);
          }

          return boundFnValue;
        }

        // Handle cases where computed properties in class components
        // may reference state attributes not destructured from `this.store`.
        key === "computed" && (computer.stateRefsHook = deps => {
          deps.forEach(key => {
            this._$stateRefs_.add(key as (string | number));
          });
        });

        return (store as any as StoreMeta<S>)[key as keyof StoreMeta<S>];
      },
      // TODO classEngineStore可能需要递归代理生成proxy，像StoreMeta的createProxy方法那样，以便于链式更新
      set: (_, key: keyof S, value: ValueOf<S>) => updateStateMeta(key, value),
      deleteProperty: (_, key: keyof S) => updateStateMeta(
        key, undefined as ValueOf<S>, true,
      ),
      // TODO delete methods waiting upgrade
    } as ProxyHandler<ClassStoreType<S>>);

    this._$store_ = classEngineStore;

    return classEngineStore;
  };
}
