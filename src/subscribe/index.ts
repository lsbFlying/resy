import type { PrimitiveState, MapType } from "../types";
import type { SchedulerType } from "../scheduler/types";
import type { ListenerType, SubscriptionRefType } from "./types";
import type { Store } from "../store/types";
import { effectStateInStateKeys } from "../store/utils";
import { useEffect, useRef } from "react";

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
 * It`s advantage is that you only need to consider the data you want to subscribe to,
 * rather than the psychological burden to consider whether the data reference inside the function can get the latest value.
 * UseSubscription will reduce your mental burden and allow you to use it normally.
 */
export const useSubscription = <S extends PrimitiveState>(
  store: Store<S>,
  listener: ListenerType<S>,
  stateKeys?: (keyof S)[],
) => {
  const ref = useRef<SubscriptionRefType<S> | null>(null);

  /**
   * The ref writing here essentially does not affect the rules of React pure functions.
   * @description stateKeys is generally stable,
   * and it is not recommended to use scenarios with changes in stateKeys,
   * but the use of complex scenarios is still considered here
   */
  ref.current = {
    listener,
    stateKeys,
  };

  useEffect(() =>
    // Monitor the overall data changes of the store
    store.subscribe(data => {
      /**
       * @description First determine whether there is a change in execution,
       * and if so, delay the execution in order to get the latest listening subscription function
       * and the array of listening data attributes given by useMemo.
       */
      if (effectStateInStateKeys(data.effectState, ref.current!.stateKeys)) {
        // Delay execution in order to get the new listener function after re-rendering
        Promise.resolve(data).then(rd => {
          ref.current!.listener(rd);
        });
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  , []);
};
