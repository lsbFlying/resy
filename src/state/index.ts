import type { Callback, PrimitiveState } from "../types";
import type { StateMetaMapType } from "./types";
import type StoreMeta from "../store/core";
import type Restorer from "../restore";
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
  constructor(
    public key: keyof S,
    public $stateMetaMap: StateMetaMapType<S>,
    public $storeMeta: StoreMeta<S>,
    public $restorer: Restorer<S>,
  ) {
    // Perform refresh recovery logic if initialState is a function
    $restorer.initialStateRetrieve();
  }

  // The Set memory of the update function of a single attribute
  readonly stateChangeQueue = new Set<Callback>();

  subscribe = (onStateChange: Callback) => {
    const $restorer = this.$restorer;

    // If a component references the data, the update function will be added to stateChangeSet
    this.stateChangeQueue.add(onStateChange);

    // Increment the reference count by 1 if the component is referenced
    $restorer.stateMetaRefCounter++;

    return () => {
      this.stateChangeQueue.delete(onStateChange);
      $restorer.stateMetaRefCounter--;

      $restorer.deferRestoreProcessing(
        () => {
          // Release memory if there are no component references
          if (!this.stateChangeQueue.size) {
            delete this.$stateMetaMap[this.key];
          }
        },
      );
    };
  };

  getSnapshot = () => {
    return this.$storeMeta._$state_[this.key];
  };

  useStateMeta() {
    const { key } = this;
    const $stateMetaMap = this.$stateMetaMap;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useSyncExternalStore(
      $stateMetaMap[key]!.subscribe,
      $stateMetaMap[key]!.getSnapshot,
      $stateMetaMap[key]!.getSnapshot,
    );
  }

  updater() {
    this.stateChangeQueue.forEach(stateChange => {
      stateChange();
    });
  }
}
