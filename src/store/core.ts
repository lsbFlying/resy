import type {
  AnyBoundFn, InitialState, InnerStoreOptions, StateWithThisType,
  Store, StateMetaMapType, StoreOptions, MacroStore, UseMacroStore,
} from "./types";
import type { AnyFn, MapType, PrimitiveState, ValueOf } from "../types";
import type { ComponentWithStore } from "../class-connect";
import type { ClassStoreType } from "../class-connect/types";
import { optionsErrorProcessing, stateErrorProcessing } from "./errors";
import { __COMPUTED_PREFIX__, __RESY_BRAND__ } from "./static";
import { hasOwnProperty } from "../utils";
import { __DEV__ } from "../static";
import { proxyable } from "../immutable/utils";
import { ApplyOriginFunctionType, KeyChainsSourceItemType } from "../immutable/types";
import { __MAP_SET_PROTOTYPE_PROXYABLE_TARGET__ } from "../immutable";
import { useDebugValue, useEffect, useState } from "react";
import StateMeta from "../state";
import Scheduler from "../scheduler";
import Updater from "../updater";
import Subscriber from "../subscribe";
import Restorer from "../restore";

/**
 * @description The core meta-structure of store
 */
export default class StoreMeta<S extends PrimitiveState> {
  constructor(initialState?: InitialState<S>, options?: StoreOptions) {
    this._initialState_ = initialState;
    this._reducerState_ = typeof initialState === "function"
      ? initialState()
      : (initialState ?? ({} as StateWithThisType<S>));

    optionsErrorProcessing(options);
    this._options_ = options
      ? Object.assign({}, StoreMeta.#DEFAULT_OPTIONS, options)
      : StoreMeta.#DEFAULT_OPTIONS;

    const reducerState = this._reducerState_;

    stateErrorProcessing({ state: reducerState, options: this._options_ });

    this.$state = Object.assign({}, reducerState);

    this.store = this.#createProxy();
  }

  __RESY_BRAND__ = __RESY_BRAND__;

  static #DEFAULT_OPTIONS: InnerStoreOptions = {
    unmountRestore: true,
    namespace: undefined,
    immutable: undefined,
    enableMarcoActionStateful: undefined,
    __useConciseState__: undefined,
    __enableMacros__: undefined,
    __functionName__: "createStore",
  };
  // configuration
  readonly _options_;

  /** ============================== For core constant ready start ============================== */
  readonly _initialState_?: InitialState<S>;
  // Retrieve the reducerState
  _reducerState_: S;

  $state: S;

  // TODO computedDeps waiting upgrade
  // Dependency Collection for computed
  computedDeps = new Set<keyof S>();

  // The core map meta-structure of stateMeta
  readonly _stateMetaMap_: StateMetaMapType<S> = new Map();

  // The storage stack of this instance for the class component
  readonly _classInstanceStack_ = new Set<ComponentWithStore<{}, S>>();
  /** ============================== For core constant ready end ============================== */

  /** ============================== For Scheduler、Subscriber、Restorer start ============================== */
  // scheduler
  readonly _scheduler_ = new Scheduler<S>();

  // updater
  readonly _updater_ = new Updater(this);
  setState = this._updater_.setState;
  syncUpdate = this._updater_.syncUpdate;

  // subscriber
  readonly _subscriber_ = new Subscriber(this);
  subscribe = this._subscriber_.subscribe;
  useSubscription = this._subscriber_.useSubscription;

  // restorer
  readonly _restorer_ = new Restorer(this);
  restore = this._restorer_.restore;

  // After unmount resetting the state (`restoreProcessing` function has been executed),
  // it is in a frozen state where updates are prohibited.
  // TODO waiting considering, the scenes it contains are a bit complex
  // #freezing: boolean | undefined;
  /** ============================== For Scheduler、Subscriber、Restorer  end ============================== */

  /** ============================== For core render start ============================== */
  // A proxy object with the capabilities of updating and data tracking.
  readonly store: Store<S>;

  // Proxy of driver update re-render for useStore
  readonly $engineStore = new Proxy({} as MacroStore<S>, {
    get: (_: S, key: keyof S) => {
      const state = this.$state;

      // Get the latest value
      const value = state[key];

      const sourceFromThis = hasOwnProperty.call(this, key);

      if (!sourceFromThis && typeof value !== "function") {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        __DEV__ && useDebugValue({
          key,
          value,
          ...(
            this._options_.namespace
              ? { namespace: this._options_.namespace }
              : null
          ),
        });

        return this._getStateMeta_(key)!.useStateMeta();
      }

      if (!sourceFromThis && typeof value === "function") {
        // Avoid memory redundancy waste caused by repeated bindings and maintain the function reference address unchanged.
        !(value as AnyBoundFn).__bound__ && this._boundFnProcessing_(key, value);

        const fnStateful = !this._options_.__enableMacros__
          || this._options_.enableMarcoActionStateful;

        const boundFnValue = state[key];

        // eslint-disable-next-line react-hooks/rules-of-hooks
        fnStateful && __DEV__ && useDebugValue({
          key,
          value: boundFnValue,
          ...(
            this._options_.namespace
              ? { namespace: this._options_.namespace }
              : null
          ),
        });

        /**
         * @description Enable function properties to have the ability to update rendering.
         * Placing both the __bound__ and the state's set operation before the useStateMeta
         * can preemptively avoid the tearing synchronization handling inside useSyncExternalStore,
         * resulting in twice the redundant rendering execution.
         */
        fnStateful && this._getStateMeta_(key)!.useStateMeta();

        return !key.toString().startsWith(__COMPUTED_PREFIX__)
          ? boundFnValue
          // TODO waiting upgrade optimize (暂时应该没有属性依赖记录收集销毁的逻辑问题)
          : () => {
            const { computedDeps } = this;

            const [{ result, stateKeys }, update] = useState(() => {
              // Clear the previous dirty dependencies before collecting them
              computedDeps.clear();
              const res = (boundFnValue as AnyFn)();
              return {
                result: res,
                stateKeys: Array.from(computedDeps) as (keyof S)[],
              };
            });

            useEffect(() => this._subscriber_.subscribe(() => {
              /**
               * Perform dependency collection and processing again to
               * prevent dependency changes caused by conditional logic
               * start
               */
              computedDeps.clear();

              const res = (boundFnValue as AnyFn)();

              const newDeps = Array.from(computedDeps);

              (stateKeys.toString() !== newDeps.toString()) && update(prevState => ({
                ...prevState,
                stateKeys: newDeps,
              }));
              /**
               * Perform dependency collection and processing again to
               * prevent dependency changes caused by conditional logic.
               */

              update(prevState => ({
                ...prevState,
                result: res,
              }));
              // eslint-disable-next-line react-hooks/exhaustive-deps
            }, stateKeys), [stateKeys]);

            return result;
          };
      }

      return this[key as keyof StoreMeta<S>];
    },
  } as ProxyHandler<MacroStore<S>>);
  /** ============================== For core render end ============================== */

  _boundFnProcessing_ = (
    key: keyof S,
    value: AnyBoundFn,
    thisArg: Store<S> | ClassStoreType<S> = this.store,
  ) => {
    const state = this.$state;

    const boundFn = (
      (...args: unknown[]) => (value as AnyFn).apply(thisArg, args)
    ) as AnyBoundFn;

    boundFn.__bound__ = true;

    state[key] = boundFn as ValueOf<S>;

    return boundFn as ValueOf<S>;
  };

  _getStateMeta_ = (key: keyof S) => {
    const { _stateMetaMap_ } = this;
    // Resolve the problem that the initialization attribute may be undefined
    if (_stateMetaMap_.has(key)) return _stateMetaMap_.get(key);

    const stateMetaInstance = new StateMeta<S>(key, this);
    _stateMetaMap_.set(key, stateMetaInstance);

    return stateMetaInstance;
  };

  #createProxy = (
    target: object = this.$state,
    parentTarget: object = this.$state,
    firstLevelKey?: keyof S,
    keyLevel?: number,
    keyChains?: Set<KeyChainsSourceItemType<S>>,
    applyOriginFunction?: ApplyOriginFunctionType,
  ) => {
    const { computedDeps, _options_: { immutable } } = this;
    return new Proxy(target, {
      get: (_: S, key: keyof S) => {

        const sourceFrom$State = !firstLevelKey;

        /**
         * @description `this.$state` is writable, so we need to check here,
         * if the data originates from `$state`,
         * the latest value should be re-fetched from this.$state.
         * If `target[key]` is used directly,
         * it may lead to incorrect changes due to discrepancies
         * between the initially referenced address and the updated reference address
         * of `this.$state` after modifications.
         */
        const value = sourceFrom$State ? this.$state[key] : (target as S)[key];

        sourceFrom$State && computedDeps.add(key);

        const sourceFromThis = hasOwnProperty.call(this, key);

        if (!sourceFromThis && immutable && proxyable(value)) {
          return this.#createProxy(
            value as object,
            target,
            firstLevelKey ?? key,
            (keyLevel ?? 0) + 1,
            (
              keyChains
                // Proxy map and set prototype functions are not added to keyChains.
                ? typeof value === "function"
                  ? new Set(keyChains)
                  : new Set(keyChains).add({ key })
                : new Set().add({ key })
            ) as Set<KeyChainsSourceItemType<S>>,
          );
        }

        /**
         * @description Only bind functions that handle `this.$state`,
         * Processing this-binding for functions nested beyond the second level
         * is practically unnecessary for several reasons:
         * First, such complex and unmaintainable coding patterns are uncommon in practice.
         * Second, even if such multi-level nested functions exist,
         * their this context (for non-arrow functions) should naturally reference
         * their direct host object according to JavaScript's this-binding rules.
         *
         * Most fundamentally, our this-binding processing specifically targets action-type handler functions.
         * By definition, action functions are designed to be used at the first property level,
         * so deeper nested functions are explicitly excluded from this processing.
         */
        if (
          !sourceFromThis
          && typeof value === "function"
          && sourceFrom$State
          && !(value as AnyBoundFn).__bound__
        ) {
          return this._boundFnProcessing_(key, value);
        }

        return !sourceFromThis ? value : this[key as keyof StoreMeta<S>];
      },
      set: (_: S, key: keyof S, value: ValueOf<S>) => this._updater_.updateStateMeta(
        key, value, false, target, firstLevelKey,
        new Set(keyChains).add({ key }), applyOriginFunction,
      ),
      // Delete will also play an updating role
      deleteProperty: (_: S, key: keyof S) => this._updater_.updateStateMeta(
        key, undefined as ValueOf<S>, true, target, firstLevelKey,
        new Set(keyChains).add({ key }), applyOriginFunction,
      ),
      // The `apply` here is written specifically for prototype chain functions
      // that are applicable to proxyable types such as `Map`, and `Set`.
      apply: (applyOriginFunction: any, thisArg: any, argArray: any[]) => Reflect.apply(
        __MAP_SET_PROTOTYPE_PROXYABLE_TARGET__.get(applyOriginFunction)!(
          applyOriginFunction, thisArg, this.$state, parentTarget as (MapType<S> & Set<S>),
          this.#createProxy, firstLevelKey, keyLevel, keyChains, this._updater_.updateStateMeta,
        ),
        thisArg,
        argArray,
      ),
    } as ProxyHandler<S>) as Store<S>;
  };
  /** ============================== For core utils end ============================== */

  useStore = (() => this.$engineStore) as UseMacroStore<S>;
}
