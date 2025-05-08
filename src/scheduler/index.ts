import type { MapType, PrimitiveState, Callback, ValueOf } from "../types";
import type { StateCallbackItem, State, StateCallback } from "../store/types";
import { stateCallbackErrorProcessing } from "../store/errors";
import { mapToObject } from "../store/utils";

/**
 * @description Scheduling instance for batch updates.
 */
export default class Scheduler<S extends PrimitiveState> {
  // task data of updated
  taskDataMap: MapType<S> = new Map();
  // task queue of updated
  taskQueueMap: Map<keyof S, Callback> = new Map();
  // Callback function stack
  callbackStackSet = new Set<StateCallbackItem<S>>();

  // Flag for ongoing update
  isUpdating?: Promise<void>;
  // Flag for the upcoming update execution
  willUpdating?: true;
  // Flag to delay the execution of the return registration function in useEffect
  deferEffectDestructorExecFlag?: Promise<void>;

  // Push both the updated data (in key/value pairs) and the update task queue into the stack
  pushTask = (key: keyof S, value: ValueOf<S>, task: Callback) => {
    this.taskDataMap.set(key, value);
    this.taskQueueMap.set(key, task);
  };

  // Push the callback onto the stack and wait for subsequent execution
  pushCallbackStack = (stateMap: MapType<S>, state: State<S>, callback?: StateCallback<S>) => {
    if (callback !== undefined) {
      stateCallbackErrorProcessing(callback);
      const nextState: S = Object.assign({}, mapToObject(stateMap), state);
      this.callbackStackSet.add({ nextState, callback });
    }
  };

  // Flush and clear the task data and task queue
  flushTask = () => {
    this.taskDataMap.clear();
    this.taskQueueMap.clear();
  };
}
