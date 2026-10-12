import type { PrimitiveState, ValueOf } from "../types";
import type { AnyBoundFn, Store } from "../store/types";
import type { ClassStoreType } from "./types";
import MetaStore from "../store/core";
import { PureComponent } from "react";
import { storeErrorProcessing } from "../store/errors";
import { _COMPUTED_PREFIX_ } from "../store/static";
import { _RESY_CWS_BRAND_ } from "./static";

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
    // Must call super constructor in derived class before accessing 'this'
    // or returning from derived constructor.
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
            abf._unsubscribe_?.();
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
            (store as any as MetaStore<S>)._updater_.classInstanceStack.delete(this);
            (store as any as MetaStore<S>)._restorer_.deferRestoreProcessing();
          });
        }
      });
    };
  }

  static displayName?: string;

  [_RESY_CWS_BRAND_] = _RESY_CWS_BRAND_;

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

  /**
   * @description Read a first-level state key for a class component.
   *
   * Reading is delegated to `store.store`, the base proxy. That single
   * delegation is what gives class components the whole chained-update
   * behaviour for free: the base proxy wraps nested objects lazily and routes
   * every write through `commitPath`, so `this.store.userInfo.address.city` and
   * `this.store.list.push(x)` work without a second implementation here.
   *
   * 🌟 The key is registered for re-render filtering at the same time. Only
   * first-level keys are registered, which matches the granularity of the hook
   * side.
   */
  #getState<S extends PrimitiveState>(key: keyof S, store: MetaStore<S>) {
    this._$stateRefs_.add(key as (string | number));
    return store.store[key];
  };

  connectStore<S extends PrimitiveState>(store: Store<S>) {
    storeErrorProcessing(store, "connectStore");
    (store as any as MetaStore<S>)._restorer_.initialStateRetrieve();
    this.#stores.add(store);

    const { _updater_: updater, _computer_: computer } = store as any as MetaStore<S>;

    updater.classInstanceStack.add(this as any as ComponentWithStore<P, S, SS>);

    const { computed, computedDeps } = computer;

    // Data agents for use by class components
    /**
     * @description The read-only face of the store for class components.
     *
     * It handles exactly the three things the base proxy cannot: dependency
     * registration for computed and re-render filtering, `this`-binding for
     * action functions, and forwarding store utility methods. Everything below
     * the first level is delegated to `store.store` (see `#getState`), which is
     * where nested wrapping and chained writes happen.
     */
    const classEngineStore = new Proxy({} as ClassStoreType<S>, {
      get: (_, key: keyof S) => {
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

        const sourceFromStore = Reflect.has((store as any as MetaStore<S>), key);

        const state = (store as any as MetaStore<S>)._$state_;

        const value = state[key];

        if (!sourceFromStore && typeof value !== "function") {
          return this.#getState(key, store as any as MetaStore<S>);
        }

        if (!sourceFromStore && typeof value === "function") {
          const boundFnValue = (value as AnyBoundFn)._bound_
            ? value
            : (store as any as MetaStore<S>)._boundFnProcessing_(
              value as AnyBoundFn,
              classEngineStore,
            );

          const isComputed = key.toString().startsWith(_COMPUTED_PREFIX_);
          if (isComputed) {
            this.#computedSubscribers.add(boundFnValue);
            // TODO bind产生新的引用，待优化
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

        return (store as any as MetaStore<S>)[key as keyof MetaStore<S>];
      },
      /**
       * @description Forward first-level writes to the public write entry point.
       *
       * Without these traps the proxy had a `get` only, so `this.store.count = 5`
       * fell through to the default behaviour and landed on the empty proxy
       * target: no error, no state change, no re-render. Forwarding to the
       * outer `createStore` proxy keeps `this.store.count = 5` on exactly the
       * same path as the hook-side `store.count = 5`, so the two cannot drift.
       */
      set: (_, key: keyof S, value: ValueOf<S>) => Reflect.set(store, key, value),
      deleteProperty: (_, key: keyof S) => Reflect.deleteProperty(store, key),
    } as ProxyHandler<ClassStoreType<S>>);

    return this._$store_ = classEngineStore;
  };
}
