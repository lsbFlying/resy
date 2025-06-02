import type { Callback, PrimitiveState } from "../types";
import type StoreMeta from "../store/core";
import useSyncExternalStoreExports from "use-sync-external-store/shim";

/**
 * @description Additional references are utilized to ensure the compatibility
 * of the package in ESM since 'use-sync-external-store' only exports in CJS format.
 */
const { useSyncExternalStore } = useSyncExternalStoreExports;

/**
 * @description The core meta-structure of state
 */
export default class StateMeta<S extends PrimitiveState> {
  // eslint-disable-next-line no-empty-function
  constructor(public key: keyof S, public storeMetaInstance: StoreMeta<S>) {}

  // The Set memory of the update function of a single attribute
  stateChangeQueue = new Set<Callback>();

  subscribe = (onStateChange: Callback) => {
    // If a component references the data, the update function will be added to stateChangeSet
    this.stateChangeQueue.add(onStateChange);

    // Increment the reference count by 1 if the component is referenced
    this.storeMetaInstance._restorer_._stateMetaRefCounter_++;

    return () => {
      this.stateChangeQueue.delete(onStateChange);
      this.storeMetaInstance._restorer_._stateMetaRefCounter_--;

      this.storeMetaInstance._restorer_.deferRestoreProcessing(
        () => {
          // Release memory if there are no component references
          if (!this.stateChangeQueue.size) {
            this.storeMetaInstance._stateMetaMap_.delete(this.key);
          }
        },
      );
    };
  };

  getSnapshot = () => {
    return this.storeMetaInstance.$state[this.key];
  };

  useStateMeta = () => {
    const {
      key, storeMetaInstance: {
        _stateMetaMap_, _restorer_,
      },
    } = this;

    // Perform refresh recovery logic if initialState is a function
    _restorer_.initialStateRetrieve();

    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useSyncExternalStore(
      _stateMetaMap_.get(key)!.subscribe,
      _stateMetaMap_.get(key)!.getSnapshot,
      _stateMetaMap_.get(key)!.getSnapshot,
    );
  };

  updater = () => {
    this.stateChangeQueue.forEach(stateChange => {
      stateChange();
    });
  };
}
