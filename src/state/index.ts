import type { Callback, PrimitiveState } from "../types";
import type MetaStore from "../store/core";
import type Restorer from "../restore";
import { useDebugValue } from "react";
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
            // delete this.$metaStateMap[this.key];
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

    const { subscribe, getSnapshot } = this;

    const { _options_: { namespace }, _$state_ } = this.$metaStore;

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
    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  }

  updater() {
    this.stateChangeQueue.forEach(stateChange => {
      stateChange();
    });
  }
}
