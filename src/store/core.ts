import type {
  AnyBoundFn, InitialState, StateWithThisType, Store,
  StoreOptions, MacroStore, UseMacroStore, InnerStoreOptions,
} from "./types";
import type { AnyFn, MapType, PrimitiveState, ValueOf } from "../types";
import type { ClassStoreType } from "../class-connect/types";
import type { SetStateType, SyncUpdateType } from "../updater/types";
import type { SubscribeType, UseSubscriptionType } from "../subscribe/types";
import type { RestoreType } from "../restore/types";
import type { ApplyOriginFunctionType, KeyChainsSourceItemType } from "../immutable/types";
import type { UseComputedType, ComputedType } from "../computer/types";
import { optionsErrorProcessing, stateErrorProcessing } from "./errors";
import { _COMPUTED_PREFIX_, _RESY_BRAND_, DEFAULT_OPTIONS } from "./static";
import { hasOwnProperty } from "../utils";
import { proxyable } from "../immutable/utils";
import { _MAP_SET_PROTOTYPE_PROXYABLE_TARGET_ } from "../immutable";
import MetaState from "../state";
import Scheduler from "../scheduler";
import Subscriber from "../subscribe";
import Updater from "../updater";
import Restorer from "../restore";
import Computer from "../computer";
import {useLayoutEffect} from "react";

/**
 * @description The core meta-structure of store
 */
export default class MetaStore<S extends PrimitiveState> {
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

  readonly [_RESY_BRAND_] = _RESY_BRAND_;

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
  readonly _subscriber_ = new Subscriber(this);

  useComputed!: UseComputedType["useComputed"];
  computed!: ComputedType["computed"];
  // Computer
  readonly _computer_ = new Computer(this);

  setState!: SetStateType<S>["setState"];
  syncUpdate!: SyncUpdateType<S>["syncUpdate"];
  // Updater
  readonly _updater_ = new Updater(this);

  restore!: RestoreType<S>["restore"];
  // Restorer
  readonly _restorer_ = new Restorer(this);

  readonly _metaState_ = new MetaState<S>(this, this._restorer_);

  // After unmount resetting the state (`restoreProcessing` function has been executed),
  // it is in a frozen state where updates are prohibited.
  // TODO waiting considering, the scenes it contains are a bit complex
  // #freezing: boolean | undefined;
  /** ============================== For Core Component Element  end ============================== */

  /** ============================== For Core Render Element start ============================== */
  _$state_: S;

  // A proxy object with the capabilities of updating and data tracking.
  readonly store: Store<S>;

  _$engineStore_!: MacroStore<S>;

  _$snapshot_!: S;

  _$isRendering_ = false;

  useStore: UseMacroStore<S> = () => {
    this._$snapshot_ = this._metaState_.useMetaState();

    this._$isRendering_ = true;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useLayoutEffect(() => {
      this._$isRendering_ = false;
    });

    return this._$engineStore_ ??= new Proxy(this._$snapshot_, {
      get: (_: S, key: keyof S) => {
        const state = this._$state_;

        // Get the latest value
        const value = state[key];

        const sourceFromThis = hasOwnProperty.call(this, key);

        if (!sourceFromThis && typeof value !== "function") {
          return this._$isRendering_ ? this._$snapshot_[key] : state[key];
        }

        if (!sourceFromThis && typeof value === "function") {
          // Avoid memory redundancy waste caused by repeated bindings and maintain the function reference address unchanged.
          !(value as AnyBoundFn)._bound_ && this._boundFnProcessing_(key, value);

          const boundFnValue = state[key];

          return !key.toString().startsWith(_COMPUTED_PREFIX_)
            ? boundFnValue
            // TODO bind产生新的引用，待优化
            : this.useComputed.bind(null, boundFnValue);
        }

        return this[key as keyof MetaStore<S>];
      },
      set: (_: S, key: keyof S, value: ValueOf<S>) => this._updater_.updateMetaState(
        key, value, false,
      ),
      // Delete will also play an updating role
      deleteProperty: (_: S, key: keyof S) => this._updater_.updateMetaState(
        key, undefined as ValueOf<S>, true,
      ),
    }) as MacroStore<S>;
  };
  /** ============================== For Core Render Element end ============================== */

  /** Helper function for binding function properties  */
  _boundFnProcessing_(
    key: keyof S,
    value: AnyBoundFn,
    thisArg: Store<S> | ClassStoreType<S> = this.store,
  ) {
    const state = this._$state_;

    const boundFn = (
      (...args: unknown[]) => (value as AnyFn).apply(thisArg, args)
    ) as AnyBoundFn;

    boundFn._bound_ = true;
    boundFn._name_ = value.name;

    state[key] = boundFn as ValueOf<S>;

    return boundFn as ValueOf<S>;
  }

  /** Create Store Proxy */
  #createProxy(
    target: object = this._$state_,
    parentTarget: object = this._$state_,
    firstLevelKey?: keyof S,
    keyLevel?: number,
    keyChains?: Set<KeyChainsSourceItemType<S>>,
    applyOriginFunction?: ApplyOriginFunctionType,
  ) {
    const {
      _computer_: computer,
      _options_: { immutable },
      _updater_: updater,
    } = this;
    const { computedDeps } = computer;
    return new Proxy(target, {
      get: (_: S, key: keyof S) => {
        const sourceFrom$State = !firstLevelKey;

        computer.computing && sourceFrom$State && computedDeps.add(key);

        /**
         * @description `this._$state_` is writable, so we need to check here,
         * if the data originates from `$state`,
         * the latest value should be re-fetched from this._$state_.
         * If `target[key]` is used directly,
         * it may lead to incorrect changes due to discrepancies
         * between the initially referenced address and the updated reference address
         * of `this._$state_` after modifications.
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
         * @description Only bind functions that handle `this._$state_`,
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
          && !(value as AnyBoundFn)._bound_
        ) {
          return this._boundFnProcessing_(key, value);
        }

        return !sourceFromThis ? value : this[key as keyof MetaStore<S>];
      },
      set: (_: S, key: keyof S, value: ValueOf<S>) => updater.updateMetaState(
        key, value, false, target, firstLevelKey,
        new Set(keyChains).add({ key }), applyOriginFunction,
      ),
      // Delete will also play an updating role
      deleteProperty: (_: S, key: keyof S) => updater.updateMetaState(
        key, undefined as ValueOf<S>, true, target, firstLevelKey,
        new Set(keyChains).add({ key }), applyOriginFunction,
      ),
      // TODO waiting develop
      // The `apply` here is written specifically for prototype chain functions
      // that are applicable to proxyable types such as `Map`, and `Set`.
      apply: (applyOriginFunction: any, thisArg: any, argArray: any[]) => Reflect.apply(
        _MAP_SET_PROTOTYPE_PROXYABLE_TARGET_.get(applyOriginFunction)!(
          applyOriginFunction, thisArg, this._$state_, parentTarget as (MapType<S> & Set<S>),
          // TODO updateMetaState的this指向待修改
          this.#createProxy, firstLevelKey, keyLevel, keyChains, updater.updateMetaState,
        ),
        thisArg,
        argArray,
      ),
    } as ProxyHandler<S>) as Store<S>;
  }
}
