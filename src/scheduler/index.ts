import type { MapType, PrimitiveState, Callback, ValueOf } from "../types";
import type { Scheduler } from "./types";

/**
 * @description Each store's dispatch handler
 * Since the task queue or data inside the dispatcher is operated based on keys,
 * and different stores may have the same data attributes,
 * so it is necessary to privatize each store's dispatch handler.
 * However, the update dispatch of different stores does not affect the triggering of batch updates,
 * because the data state in Resy has been advanced further.
 * Therefore, although subsequent store updates are not actually be executed,
 * they will incidentally synchronize the data in the store with the rendering on the page.
 * This saves one update effect and can be considered a batch update handling across different stores.
 * todo At present, the effect of this characteristic is good, keep observation.
 */
export const scheduler = <S extends PrimitiveState>() => {
  // task data of updated
  const taskDataMap: MapType<S> = new Map();
  // task queue of updated
  const taskQueueSet: Set<Callback> = new Set();

  // Scheduling map for batch updates
  const schedulerProcessor: MapType<Scheduler<S>> = new Map();

  schedulerProcessor.set("isUpdating", null);
  schedulerProcessor.set("willUpdating", null);
  schedulerProcessor.set("deferDestructorFlag", null);

  schedulerProcessor.set(
    "pushTask",
    (
      key: keyof S,
      value: ValueOf<S>,
      task: Callback,
    ) => {
      taskDataMap.set(key, value);
      taskQueueSet.add(task);
    },
  );

  schedulerProcessor.set(
    "flush",
    () => {
      taskDataMap.clear();
      taskQueueSet.clear();
    },
  );

  schedulerProcessor.set(
    "getTasks",
    () => ({
      taskDataMap,
      taskQueueSet,
    }),
  );

  return schedulerProcessor;
};
