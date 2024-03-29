import type { PrimitiveState, MapType } from "../types";
import type { SchedulerType } from "../scheduler/types";
import type { ListenerType } from "./types";
import { useEffect } from "react";

// Pre-update processing (records the prevBatchState beforehand for later comparison when data changes trigger subscribers)
export const willUpdatingProcessing = <S extends PrimitiveState>(
  schedulerProcessor: MapType<SchedulerType<S>>,
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

/**
 * @description Hook of subscribe
 */
export const useSubscription = <S extends PrimitiveState>(store: S, listener: ListenerType<S>, stateKeys?: (keyof S)[]) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => store.subscribe(listener, stateKeys), []);
};
