import type { PrimitiveState } from "../types";
import MetaStore from "../store/core";

/**
 * @description Scheduler class for update.
 */
export default class Scheduler<S extends PrimitiveState> {
  // eslint-disable-next-line no-empty-function
  constructor(public $metaStore: MetaStore<S>) {}

  // task data of updated
  taskData = {} as S;

  // Flag for ongoing update
  isUpdating?: Promise<void>;
  // Flag for the upcoming update execution
  willUpdating?: true;
  // Flag to delay the execution of the return registration function in useEffect
  deferEffectDestructorExecutable?: Promise<void>;

  /**
   * @description Commit a newly built state root for the current batch.
   *
   * Paired with `commitPath`, which *builds* the root: this method resolves the
   * other half of the same operation by publishing it. It therefore never copies
   * the state tree itself — it only swaps `_$state_` to the root the caller
   * already produced and records the changed key for the subscriber payload.
   * The payload value is derived from the published root (`newRoot[key]`), so
   * the first-level key→value correspondence cannot drift, no matter how deep
   * the written path was.
   * Notification is the caller's concern: it must capture `prevState` *before*
   * calling this.
   */
  commitRoot(newRoot: S, key: keyof S) {
    this.$metaStore._$state_ = newRoot;
    this.taskData[key] = newRoot[key];
  };

  // Flush and clear the task data and task queue
  flushTask() {
    this.taskData = {} as S;
  };
}
