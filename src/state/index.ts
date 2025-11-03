import type { Callback, PrimitiveState, ValueOf } from "../types";
import type MetaStore from "../store/core";
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
  // eslint-disable-next-line no-empty-function
  constructor(public $metaStore: MetaStore<S>) {}

  engineStore?: MacroStore<S>;

  currentState?: S;

  isRendering?: boolean;

  // The Set memory of the update function of a single attribute
  readonly stateChangeQueue = new Set<Callback>();

  subscribe = (stateChange: Callback) => {
    const $restorer = this.$metaStore._restorer_;

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
            this.engineStore = undefined;
            this.currentState = undefined;
            this.isRendering = undefined;
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
    this.$metaStore._restorer_.initialStateRetrieve();

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
    this.currentState = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

    this.isRendering = true;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useLayoutEffect(() => {
      this.isRendering = false;
    });

    return this.engineStore ??= new Proxy({} as S, {
      // todo 这里需要完善后续的immutable功能，在get做惰性proxy代理，类似MetaStore的createProxy
      get: (_: S, key: keyof S) => {
        const state = $metaStore._$state_;

        // Get the latest value
        const value = state[key];

        const sourceFromStore = Reflect.has($metaStore, key);

        if (!sourceFromStore && typeof value !== "function") {
          // todo 如果这里getSnapshot最终返回的快照状态仍然是metaState，那么这里就可以直接使用state[key]，不用区分isRendering状态
          return this.isRendering ? this.currentState![key] : state[key];
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
