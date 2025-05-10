import type { MapType, PrimitiveState, Callback, ValueOf } from "../types";
import type { StateCallbackItem, State, StateCallback } from "../store/types";
import { stateCallbackErrorProcessing } from "../store/errors";
import { mapToObject } from "../store/utils";

/**
 * @description Scheduling instance for batch updates.
 */
export default class Scheduler<S extends PrimitiveState> {
  // task data of updated
  taskData: MapType<S> = new Map();
  // task queue of updated
  taskQueue: Map<keyof S, Callback> = new Map();
  // Callback function queue
  callbackQueue = new Set<StateCallbackItem<S>>();

  // Flag for ongoing update
  isUpdating?: Promise<void>;
  // Flag for the upcoming update execution
  willUpdating?: true;
  // Flag to delay the execution of the return registration function in useEffect
  deferEffectDestructorExecutable?: Promise<void>;

  // Push both the updated data (in key/value pairs) and the update task queue into the stack
  pushTask = (key: keyof S, value: ValueOf<S>, task: Callback) => {
    this.taskData.set(key, value);
    this.taskQueue.set(key, task);
  };

  // Push the callback onto the stack and wait for subsequent execution
  pushCallbackStack = (stateMap: MapType<S>, state: State<S>, callback?: StateCallback<S>) => {
    if (callback !== undefined) {
      stateCallbackErrorProcessing(callback);
      const nextState: S = Object.assign({}, mapToObject(stateMap), state);
      this.callbackQueue.add({ nextState, callback });
    }
  };

  // Flush and clear the task data and task queue
  flushTask = () => {
    this.taskData.clear();
    this.taskQueue.clear();
  };
}
