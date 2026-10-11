import type { PrimitiveState, ValueOf } from "../types";
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
   * @description Record a newly built state root in the current batch.
   *
   * The root is built by `commitPath` (copy-on-write), so this method never
   * copies the state tree itself — it only publishes the root the caller
   * already produced and records the changed key for the subscriber payload.
   */
  assignMergeState(newRoot: S, key: keyof S, value: ValueOf<S>) {
    this.$metaStore._$state_ = newRoot;
    this.taskData[key] = value;
  };

  // Flush and clear the task data and task queue
  flushTask() {
    this.taskData = {} as S;
  };
}
