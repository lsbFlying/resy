import type { MapType, PrimitiveState, Callback, ValueOf } from "../types";
import type { SchedulerType } from "./types";
import type { StateCallbackItem, State, StateCallback } from "../store/types";
import { stateCallbackErrorProcessing } from "../store/errors";
import { mapToObject } from "../store/utils";

/**
 * @description Each store's dispatch handler
 * Since the task queue or data inside the dispatcher is operated based on keys,
 * and different stores may have the same data attributes,
 * so it is necessary to privatize each store's dispatch handler.
 * However, the update dispatch of different stores does not affect the triggering of batch updates,
 * because the data state in resy has been pre-synchronous execution.
 * Therefore, although subsequent store updates are not actually be executed,
 * they will incidentally synchronize the data in the store with the rendering on the page.
 * This saves one update effect and can be considered a batch update handling across different stores.
 * At present, the effect of this characteristic is good, keep observation.
 */
export const scheduler = <S extends PrimitiveState>() => {
  // task data of updated
  const taskDataMap: MapType<S> = new Map();
  // task queue of updated
  const taskQueueMap: Map<keyof S, Callback> = new Map();
  // Callback function stack
  const callbackStackSet = new Set<StateCallbackItem<S>>();

  // Scheduling map for batch updates
  const schedulerProcessor: MapType<SchedulerType<S>> = new Map();

  schedulerProcessor.set("isUpdating", null);
  schedulerProcessor.set("willUpdating", null);
  schedulerProcessor.set("deferEffectDestructorExecFlag", null);

  schedulerProcessor.set(
    "pushTask",
    (
      key: keyof S,
      value: ValueOf<S>,
      task: Callback,
    ) => {
      taskDataMap.set(key, value);
      taskQueueMap.set(key, task);
    },
  );

  schedulerProcessor.set(
    "pushCallbackStack",
    (
      stateMap: MapType<S>,
      state: State<S>,
      callback?: StateCallback<S>,
    ) => {
      if (callback !== undefined) {
        stateCallbackErrorProcessing(callback);
        const nextState: S = Object.assign({}, mapToObject(stateMap), state);
        callbackStackSet.add({ nextState, callback });
      }
    },
  );

  schedulerProcessor.set(
    "flushTask",
    () => {
      taskDataMap.clear();
      taskQueueMap.clear();
    },
  );

  schedulerProcessor.set(
    "getSchedulerQueue",
    () => ({
      taskDataMap,
      taskQueueMap,
      callbackStackSet,
    }),
  );

  return schedulerProcessor;
};
