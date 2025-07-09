import type { PrimitiveState, Callback, ValueOf } from "../types";
import type { StateCallbackItem, State, StateCallback } from "../updater/types";
import { stateCallbackErrorProcessing } from "../store/errors";

/**
 * @description Scheduler class for update.
 */
export default class Scheduler<S extends PrimitiveState> {
  // task data of updated
  taskData = {} as S;
  // task queue of updated
  readonly taskQueue: Map<keyof S, Callback> = new Map();
  // Callback function queue
  readonly callbackQueue = new Set<StateCallbackItem<S>>();

  // Flag for ongoing update
  isUpdating?: Promise<void>;
  // Flag for the upcoming update execution
  willUpdating?: true;
  // Flag to delay the execution of the return registration function in useEffect
  deferEffectDestructorExecutable?: Promise<void>;

  // Push both the updated data (in key/value pairs) and the update task queue
  pushTask(key: keyof S, value: ValueOf<S>, task: Callback) {
    this.taskData[key] = value;
    this.taskQueue.set(key, task);
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
    this.taskQueue.clear();
  };
}
