import type { PrimitiveState, MapType } from "../types";
import type { SchedulerType } from "../scheduler/types";
import type { ListenerType } from "./types";

// Pre-update processing
// records the prevBatchState beforehand for later comparison when data changes trigger subscribers
export const willUpdatingProcessing = <S extends PrimitiveState>(
  listenerSet: Set<ListenerType<S>>,
  schedulerProcessor: MapType<SchedulerType<S>>,
  prevBatchState: MapType<S>,
  stateMap: MapType<S>,
) => {
  if (listenerSet.size > 0 && !schedulerProcessor.get("willUpdating")) {
    schedulerProcessor.set("willUpdating", true);
    // Clear first to prevent store from having delete operations that cause prevBatchState to retain deleted data
    prevBatchState.clear();
    stateMap.forEach((value, key) => {
      prevBatchState.set(key, value);
    });
  }
};
