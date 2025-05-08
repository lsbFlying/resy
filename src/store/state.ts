import type { Callback, PrimitiveState } from "../types";
import type { StateMetaProps } from "./types";
import type StoreCore from "./store";
import useSyncExternalStoreExports from "use-sync-external-store/shim";

/**
 * @description Additional references are utilized to ensure the compatibility
 * of the package in ESM since 'use-sync-external-store' only exports in CJS format.
 */
const { useSyncExternalStore: useSyncExternalStoreCore } = useSyncExternalStoreExports;

export default class StateMeta<S extends PrimitiveState> {
  constructor(props: StateMetaProps<S>) {
    const { thisArgStore, key } = props;
    this.thisArgStore = thisArgStore;
    this.key = key;
  }
  thisArgStore: StoreCore<S>;
  key: keyof S;

  // The Set memory of the update function of a single attribute
  stateChangeSet = new Set<Callback>();

  subscribe = (onStateChange: Callback) => {
    // If a component references the data, the update function will be added to stateChangeSet
    this.stateChangeSet.add(onStateChange);

    const {
      thisArgStore: {
        storeStateRefCounterMap, deferRestoreProcessing,
        storeMap,
      },
    } = this;

    // Increment the reference count by 1 if the component is referenced
    storeStateRefCounterMap.set("counter", storeStateRefCounterMap.get("counter")! + 1);

    return () => {
      this.stateChangeSet.delete(onStateChange);
      storeStateRefCounterMap.set("counter", storeStateRefCounterMap.get("counter")! - 1);

      deferRestoreProcessing(
        () => {
          // Release memory if there are no component references
          if (!this.stateChangeSet.size) {
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
    this.stateChangeSet.forEach(stateChange => {
      stateChange();
    });
  };
}
