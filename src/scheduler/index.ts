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

  // Assign and merge to update data
  assignMergeState(key: keyof S, value: ValueOf<S>, isDelete?: boolean) {
    const { $metaStore } = this;
    const { _$state_ } = $metaStore;
    /**
     * @description Pre execution of internal state updates
     * facilitates the execution of synchronized code for each update step,
     * and the latest data state is obtained when retrieving the state again.
     */
    if (!isDelete) {
      $metaStore._$state_ = {
        ..._$state_,
        [key]: value,
      };
    } else {
      delete _$state_[key];
      $metaStore._$state_ = {
        ..._$state_,
      };
    }

    this.taskData[key] = value;
  };

  // Flush and clear the task data and task queue
  flushTask() {
    this.taskData = {} as S;
  };
}
