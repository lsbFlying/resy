import type { Callback, PrimitiveState, ValueOf } from "../types";
import type MetaStore from "../store/core";
import type Restorer from "../restore";
import type { AnyBoundFn, MacroStore } from "../store/types";
import { useDebugValue, useLayoutEffect } from "react";
import { _COMPUTED_PREFIX_ } from "../store/static";
import useSyncExternalStoreExports from "use-sync-external-store/shim";

/**
 * @description Additional references are utilized to ensure the compatibility
 * of the package in ESM since 'use-sync-external-store' only exports in CJS format.
 */
const { useSyncExternalStore } = useSyncExternalStoreExports;

/**
 * @description The core meta-structure of state
 */
export default class MetaState<S extends PrimitiveState> {
  constructor(
    public $metaStore: MetaStore<S>,
    public $restorer: Restorer<S>,
    // eslint-disable-next-line no-empty-function
  ) {}

  _$engineStore_: MacroStore<S> | null = null;

  _$currentState_: S | null = null;

  _$isRendering_: boolean | null = null;

  // The Set memory of the update function of a single attribute
  readonly stateChangeQueue = new Set<Callback>();

  subscribe = (stateChange: Callback) => {
    const $restorer = this.$restorer;

    // If a component references the data, the update function will be added to stateChangeSet
    this.stateChangeQueue.add(stateChange);

    // Increment the reference count by 1 if the component is referenced
    $restorer.metaStateRefCounter++;

    return () => {
      this.stateChangeQueue.delete(stateChange);
      $restorer.metaStateRefCounter--;

      $restorer.deferRestoreProcessing(
        () => {
          // Release memory if there are no component references
          if (!this.stateChangeQueue.size) {
            this._$engineStore_ = null;
            this._$currentState_ = null;
            this._$isRendering_ = null;
          }
        },
      );
    };
  };

  getSnapshot = () => {
    return this.$metaStore._$state_;
  };

  useMetaState() {
    // Perform refresh recovery logic if initialState is a function
    this.$restorer.initialStateRetrieve();

    const { subscribe, getSnapshot, $metaStore } = this;

    const { _options_: { namespace }, _$state_ } = $metaStore;

    // eslint-disable-next-line react-hooks/rules-of-hooks
    __DEV__ && useDebugValue({
      state: _$state_,
      ...(
        namespace
          ? { namespace }
          : null
      ),
    });

    // eslint-disable-next-line react-hooks/rules-of-hooks
    this._$currentState_ = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

    this._$isRendering_ = true;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useLayoutEffect(() => {
      this._$isRendering_ = false;
    });

    return this._$engineStore_ ??= new Proxy({} as S, {
      get: (_: S, key: keyof S) => {
        const state = $metaStore._$state_;

        // Get the latest value
        const value = state[key];

        const sourceFromStore = Reflect.has($metaStore, key);

        if (!sourceFromStore && typeof value !== "function") {
          return this._$isRendering_ ? this._$currentState_![key] : state[key];
        }

        if (!sourceFromStore && typeof value === "function") {
          // Avoid memory redundancy waste caused by repeated bindings and maintain the function reference address unchanged.
          !(value as AnyBoundFn)._bound_ && $metaStore._boundFnProcessing_(key, value);

          const boundFnValue = state[key];

          return !key.toString().startsWith(_COMPUTED_PREFIX_)
            ? boundFnValue
            // TODO bind产生新的引用，待优化
            : $metaStore.useComputed.bind(null, boundFnValue);
        }

        return $metaStore[key as keyof MetaStore<S>];
      },
      set: (_: S, key: keyof S, value: ValueOf<S>) => $metaStore._updater_.updateMetaState(
        key, value, false,
      ),
      // Delete will also play an updating role
      deleteProperty: (_: S, key: keyof S) => $metaStore._updater_.updateMetaState(
        key, undefined as ValueOf<S>, true,
      ),
    }) as MacroStore<S>;
  }

  updater() {
    this.stateChangeQueue.forEach(stateChange => {
      stateChange();
    });
  }
}
