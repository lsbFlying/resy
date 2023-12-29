import type { PrimitiveState, MapType } from "../types";
import type { Scheduler } from "../scheduler/types";

// Pre-update processing (records the prevBatchState beforehand for later comparison when data changes trigger subscribers)
export const willUpdatingHandle = <S extends PrimitiveState>(
  schedulerProcessor: MapType<Scheduler<S>>,
  prevBatchState: MapType<S>,
  stateMap: MapType<S>,
) => {
  if (!schedulerProcessor.get("willUpdating")) {
    schedulerProcessor.set("willUpdating", true);
    // Clear first to prevent store from having delete operations that cause prevBatchState to retain deleted data
    prevBatchState.clear();
    stateMap.forEach((value, key) => {
      prevBatchState.set(key, value);
    });
  }
};
