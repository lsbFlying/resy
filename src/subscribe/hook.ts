import type { PrimitiveState } from "../types";
import type { ListenerType, SubscriptionRefType } from "./types";
import type { Store } from "../store/types";
import { effectStateInListenerKeys } from "../store/helpers";
import { useDebugValue, useEffect, useRef } from "react";
import { storeErrorProcessing, subscribeErrorProcessing } from "../store/errors";
import { __DEV__ } from "../static";
import StoreMeta from "../store/store";

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
  storeErrorProcessing(store, "useSubscription");
  subscribeErrorProcessing(listener, stateKeys);

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

  if (__DEV__) {
    const namespace = (store as any as StoreMeta<S>)._options_.namespace;
    const store_namespace = namespace
      ? { namespace }
      : null;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useDebugValue({
      listener,
      stateKeys,
      ...store_namespace,
    });
  }

  useEffect(() => {
    // Monitor the overall data changes of the store
    return (store as any as StoreMeta<S>)._subscribers_.subscribe(data => {
      /**
       * @description First determine whether there is a change in execution,
       * and if so, delay the execution in order to get the latest listening subscription function
       * and the array of listening data attributes given by useMemo.
       */
      if (effectStateInListenerKeys(data.effectState, ref.current!.stateKeys)) {
        // Delay execution in order to get the new listener function after re-rendering
        Promise.resolve(data).then(res => {
          ref.current!.listener(res);
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
