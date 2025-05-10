import type { Callback, PrimitiveState } from "../types";
import type StoreCore from "./store";
import useSyncExternalStoreExports from "use-sync-external-store/shim";

/**
 * @description Additional references are utilized to ensure the compatibility
 * of the package in ESM since 'use-sync-external-store' only exports in CJS format.
 */
const { useSyncExternalStore: useSyncExternalStoreCore } = useSyncExternalStoreExports;

export default class StateMeta<S extends PrimitiveState> {
  constructor(key: keyof S, thisArgStore: StoreCore<S>) {
    this.key = key;
    this.thisArgStore = thisArgStore;
  }
  thisArgStore: StoreCore<S>;
  key: keyof S;

  // The Set memory of the update function of a single attribute
  stateChangeQueue = new Set<Callback>();

  subscribe = (onStateChange: Callback) => {
    // If a component references the data, the update function will be added to stateChangeSet
    this.stateChangeQueue.add(onStateChange);

    const { thisArgStore: { deferRestoreProcessing, storeMap } } = this;

    // Increment the reference count by 1 if the component is referenced
    this.thisArgStore._stateRefCounter_++;

    return () => {
      this.stateChangeQueue.delete(onStateChange);
      this.thisArgStore._stateRefCounter_--;

      deferRestoreProcessing(
        () => {
          // Release memory if there are no component references
          if (!this.stateChangeQueue.size) {
            storeMap.delete(this.key);
          }
        },
      );
    };
  };

  getSnapshot = () => {
    return this.thisArgStore.stateMap.get(this.key);
  };

  useSyncExternalStore = () => {
    const { thisArgStore: { storeMap }, key } = this;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useSyncExternalStoreCore(
      storeMap.get(key)!.subscribe,
      storeMap.get(key)!.getSnapshot,
      storeMap.get(key)!.getSnapshot,
    );
  };

  updater = () => {
    this.stateChangeQueue.forEach(stateChange => {
      stateChange();
    });
  };
}
