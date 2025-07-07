import type {
  AnyBoundFn, InitialState, StateWithThisType, Store,
  StoreOptions, MacroStore, UseMacroStore, InnerStoreOptions,
} from "./types";
import type { AnyFn, MapType, PrimitiveState, ValueOf } from "../types";
import type { ClassStoreType } from "../class-connect/types";
import type { SetStateType, SyncUpdateType } from "../updater/types";
import type { SubscribeType, UseSubscriptionType } from "../subscribe/types";
import type { RestoreType } from "../restore/types";
import type { StateMetaMapType } from "../state/types";
import type { ApplyOriginFunctionType, KeyChainsSourceItemType } from "../immutable/types";
import { optionsErrorProcessing, stateErrorProcessing } from "./errors";
import { __COMPUTED_PREFIX__, __RESY_BRAND__, DEFAULT_OPTIONS } from "./static";
import { hasOwnProperty } from "../utils";
import { proxyable } from "../immutable/utils";
import { __MAP_SET_PROTOTYPE_PROXYABLE_TARGET__ } from "../immutable";
import { useDebugValue, useEffect, useState } from "react";
import StateMeta from "../state";
import Scheduler from "../scheduler";
import Subscriber from "../subscribe";
import Updater from "../updater";
import Restorer from "../restore";

/**
 * @description The core meta-structure of store
 */
export default class StoreMeta<S extends PrimitiveState> {
  constructor(initialState?: InitialState<S>, options?: StoreOptions) {
    this._initialState_ = initialState;

    const reducerState = typeof initialState !== "function"
      ? (initialState ?? ({} as StateWithThisType<S>))
      : initialState();

    optionsErrorProcessing(options);
    const opts = {
      ...DEFAULT_OPTIONS,
      ...(options ?? {}),
    } as InnerStoreOptions;
    this._options_ = opts;

    stateErrorProcessing({ state: reducerState, options: opts });
    this._$state_ = { ...reducerState };

    this.store = this.#createProxy();
  }

  readonly __RESY_BRAND__ = __RESY_BRAND__;

  // Configuration
  readonly _options_;
  // Initialize the incoming state
  readonly _initialState_?: InitialState<S>;

  /** ============================== For Core Component Element start ============================== */
  // Scheduler
  readonly _scheduler_ = new Scheduler<S>();

  subscribe!: SubscribeType<S>["subscribe"];
  useSubscription!: UseSubscriptionType<S>["useSubscription"];
  // Subscriber
  readonly _subscriber_ = new Subscriber(this, this._scheduler_);

  // The core map meta-structure of stateMeta
  readonly _stateMetaMap_ = {} as StateMetaMapType<S>;

  setState!: SetStateType<S>["setState"];
  syncUpdate!: SyncUpdateType<S>["syncUpdate"];
  // Updater
  readonly _updater_ = new Updater(
    this, this._scheduler_, this._subscriber_, this._stateMetaMap_,
  );

  restore!: RestoreType<S>["restore"];
  // Restorer
  readonly _restorer_ = new Restorer(
    this, this._scheduler_, this._subscriber_, this._updater_,
  );

  // After unmount resetting the state (`restoreProcessing` function has been executed),
  // it is in a frozen state where updates are prohibited.
  // TODO waiting considering, the scenes it contains are a bit complex
  // #freezing: boolean | undefined;
  /** ============================== For Core Component Element  end ============================== */

  /** ============================== For Core Render Element start ============================== */
  _$state_: S;

  // TODO _computedDeps_ waiting upgrade
  // TODO 考虑_computedDeps_是否要移除全局设置，是否要从每一个computedFn上面进行挂在，
  //  考虑全局的共同依赖是否会对不同的computed的依赖收集逻辑有影响
  // Dependency Collection for computed
  readonly _computedDeps_ = new Set<keyof S>();

  // TODO waiting upgrade optimize (暂时应该没有属性依赖记录收集销毁的逻辑问题)
  // TODO class组件可以在ComponentWithStore的内部实现一个computed方法方便组件通过继承的this.computed进行处理调用
  useComputed = <A = any>(key: keyof S, ...args: A[]) => {
    const computed = this._$state_[key];

    const { _computedDeps_ } = this;

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [params, updateParams] = useState(() => args);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      // Update params by using shallow contrast of args elements within useEffect
      updateParams(args);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, args);

    const [
      { result, stateKeys }, update,
      // eslint-disable-next-line react-hooks/rules-of-hooks
    ] = useState(() => {
      // Clear the previous dirty dependencies before collecting them
      _computedDeps_.clear();

      // Execute the computed function body to obtain the result and collect dependencies
      const res = computed(...params);

      return {
        result: res,
        stateKeys: Array.from(_computedDeps_) as (keyof S)[],
      };
    });

    const { namespace } = this._options_;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    __DEV__ && useDebugValue({
      [key]: result,
      ...(
        namespace
          ? { namespace }
          : null
      ),
    });

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => this.subscribe(() => {
      /**
       * Perform dependency collection and processing again to
       * prevent dependency changes caused by conditional logic
       * start
       */
      _computedDeps_.clear();

      const newDeps = Array.from(_computedDeps_);

      /**
       * Perform dependency collection and processing again to
       * prevent dependency changes caused by conditional logic.
       */
      // update computed deps
      (stateKeys.toString() !== newDeps.toString()) && update(prevState => ({
        ...prevState,
        stateKeys: newDeps,
      }));
      // update computed result
      update(prevState => ({
        ...prevState,
        result: computed(...params),
      }));

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, stateKeys), [stateKeys, params]);

    return result;
  };

  // A proxy object with the capabilities of updating and data tracking.
  readonly store: Store<S>;

  // Proxy of driver update re-render for useStore
  readonly _$engineStore_ = new Proxy({} as MacroStore<S>, {
    get: (_: S, key: keyof S) => {
      const state = this._$state_;

      // Get the latest value
      const value = state[key];

      const sourceFromThis = hasOwnProperty.call(this, key);

      const { namespace } = this._options_;

      if (!sourceFromThis && typeof value !== "function") {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        __DEV__ && useDebugValue({
          [key]: value,
          ...(
            namespace
              ? { namespace }
              : null
          ),
        });

        return (
          this._stateMetaMap_[key] ??= new StateMeta<S>(
            key, this._stateMetaMap_, this, this._restorer_,
          )
        ).useStateMeta();
      }

      if (!sourceFromThis && typeof value === "function") {
        // Avoid memory redundancy waste caused by repeated bindings and maintain the function reference address unchanged.
        !(value as AnyBoundFn).__bound__ && this._boundFnProcessing_(key, value);

        const boundFnValue = state[key];

        return !key.toString().startsWith(__COMPUTED_PREFIX__)
          ? boundFnValue
          // TODO bind产生新的引用，待优化
          : this.useComputed.bind(null, key);
      }

      return this[key as keyof StoreMeta<S>];
    },
  } as ProxyHandler<MacroStore<S>>);

  useStore: UseMacroStore<S> = () => this._$engineStore_;
  /** ============================== For Core Render Element end ============================== */

  /** Helper function for binding function properties  */
  _boundFnProcessing_ = (
    key: keyof S,
    value: AnyBoundFn,
    thisArg: Store<S> | ClassStoreType<S> = this.store,
  ) => {
    const state = this._$state_;

    const boundFn = (
      (...args: unknown[]) => (value as AnyFn).apply(thisArg, args)
    ) as AnyBoundFn;

    boundFn.__bound__ = true;

    state[key] = boundFn as ValueOf<S>;

    return boundFn as ValueOf<S>;
  };

  /** Create Store Proxy */
  #createProxy = (
    target: object = this._$state_,
    parentTarget: object = this._$state_,
    firstLevelKey?: keyof S,
    keyLevel?: number,
    keyChains?: Set<KeyChainsSourceItemType<S>>,
    applyOriginFunction?: ApplyOriginFunctionType,
  ) => {
    const { _computedDeps_, _options_: { immutable } } = this;
    return new Proxy(target, {
      get: (_: S, key: keyof S) => {
        const sourceFrom$State = !firstLevelKey;

        sourceFrom$State && _computedDeps_.add(key);

        /**
         * @description `this.$state` is writable, so we need to check here,
         * if the data originates from `$state`,
         * the latest value should be re-fetched from this.$state.
         * If `target[key]` is used directly,
         * it may lead to incorrect changes due to discrepancies
         * between the initially referenced address and the updated reference address
         * of `this.$state` after modifications.
         */
        const value = sourceFrom$State ? this._$state_[key] : (target as S)[key];

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
          applyOriginFunction, thisArg, this._$state_, parentTarget as (MapType<S> & Set<S>),
          this.#createProxy, firstLevelKey, keyLevel, keyChains, this._updater_.updateStateMeta,
        ),
        thisArg,
        argArray,
      ),
    } as ProxyHandler<S>) as Store<S>;
  };
}
