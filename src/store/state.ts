import type { Callback, PrimitiveState } from "../types";
import type StoreMeta from "./store";
import useSyncExternalStoreExports from "use-sync-external-store/shim";

/**
 * @description Additional references are utilized to ensure the compatibility
 * of the package in ESM since 'use-sync-external-store' only exports in CJS format.
 */
const { useSyncExternalStore: useSyncExternalStoreCore } = useSyncExternalStoreExports;

/**
 * @description The core meta-structure of state
 */
export default class StateMeta<S extends PrimitiveState> {
  constructor(key: keyof S, thisArgStore: StoreMeta<S>) {
    this.key = key;
    this.thisArgStore = thisArgStore;
  }
  thisArgStore: StoreMeta<S>;
  key: keyof S;

  // The Set memory of the update function of a single attribute
  stateChangeQueue = new Set<Callback>();

  subscribe = (onStateChange: Callback) => {
    // If a component references the data, the update function will be added to stateChangeSet
    this.stateChangeQueue.add(onStateChange);

    // Increment the reference count by 1 if the component is referenced
    this.thisArgStore._stateRefCounter_++;

    return () => {
      this.stateChangeQueue.delete(onStateChange);
      this.thisArgStore._stateRefCounter_--;

      this.thisArgStore._deferRestoreProcessing_(
        () => {
          // Release memory if there are no component references
          if (!this.stateChangeQueue.size) {
            this.thisArgStore._engineStoreMeta_.delete(this.key);
          }
        },
      );
    };
  };

  getSnapshot = () => {
    return this.thisArgStore.$state[this.key];
  };

  useSyncExternalStore = () => {
    const { thisArgStore: { _engineStoreMeta_ }, key } = this;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useSyncExternalStoreCore(
      _engineStoreMeta_.get(key)!.subscribe,
      _engineStoreMeta_.get(key)!.getSnapshot,
      _engineStoreMeta_.get(key)!.getSnapshot,
    );
  };

  updater = () => {
    this.stateChangeQueue.forEach(stateChange => {
      stateChange();
    });
  };
}
