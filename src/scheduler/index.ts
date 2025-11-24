import type { PrimitiveState, ValueOf } from "../types";
import type { StateCallbackItem, State, StateCallback } from "../updater/types";
import MetaStore from "../store/core";
import { stateCallbackErrorProcessing } from "../store/errors";

/**
 * @description Scheduler class for update.
 */
export default class Scheduler<S extends PrimitiveState> {
  constructor(public $metaStore: MetaStore<S>) {}
  // task data of updated
  taskData = {} as S;
  // Callback function queue
  readonly callbackQueue = new Set<StateCallbackItem<S>>();

  // Flag for ongoing update
  isUpdating?: Promise<void>;
  // Flag for the upcoming update execution
  willUpdating?: true;
  // Flag to delay the execution of the return registration function in useEffect
  deferEffectDestructorExecutable?: Promise<void>;

  // Push both the updated data (in key/value pairs) and the update task queue
  pushTask(key: keyof S, value: ValueOf<S>, isDelete?: boolean) {
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

  // Push the callback and wait for subsequent execution
  pushCallback($state: S, state: State<S>, callback?: StateCallback<S>) {
    if (callback !== undefined) {
      stateCallbackErrorProcessing(callback);
      this.callbackQueue.add({ nextState: { ...$state, ...state }, callback });
    }
  };

  // Flush and clear the task data and task queue
  flushTask() {
    this.taskData = {} as S;
  };
}
