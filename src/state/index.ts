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
  constructor(key: keyof S, storeMetaInstance: StoreMeta<S>) {
    this.key = key;
    this.storeMetaInstance = storeMetaInstance;
  }

  key: keyof S;
  storeMetaInstance: StoreMeta<S>;

  // The Set memory of the update function of a single attribute
  stateChangeQueue = new Set<Callback>();

  subscribe = (onStateChange: Callback) => {
    // If a component references the data, the update function will be added to stateChangeSet
    this.stateChangeQueue.add(onStateChange);

    // Increment the reference count by 1 if the component is referenced
    this.storeMetaInstance._stateRefCounter_++;

    return () => {
      this.stateChangeQueue.delete(onStateChange);
      this.storeMetaInstance._stateRefCounter_--;

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
    const { storeMetaInstance: { _stateMetaMap_ }, key } = this;
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
