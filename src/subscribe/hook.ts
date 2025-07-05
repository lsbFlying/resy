import type { PrimitiveState } from "../types";
import type { ListenerType, SubscriptionRefType } from "./types";
import type { Store } from "../store/types";
import type StoreMeta from "../store/core";
import { useDebugValue, useEffect, useRef, useState } from "react";
import { storeErrorProcessing, subscribeErrorProcessing } from "../store/errors";

/**
 * @description Hook of subscribe
 * It`s advantage is that you only need to consider the data you want to subscribe to,
 * rather than the psychological burden to consider whether the data reference
 * inside the function can get the latest value.
 * UseSubscription will reduce your mental burden and allow you to use it normally.
 * @param store Subscription Store Object
 * @param listener Subscription function callback
 * @param stateKeys Subscription dependent data attribute array
 * @param immediate Should callback be executed immediately upon subscription establishment
 */
export const useSubscription = <S extends PrimitiveState>(
  store: Store<S>,
  listener: ListenerType<S>,
  stateKeys?: (keyof S)[],
  /** @default undefined */
  immediate?: boolean,
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

  const [deps, updateDeps] = useState(() => stateKeys);
  useEffect(() => () => {
    updateDeps(ref.current?.stateKeys);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, stateKeys);

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
    return (store as any as StoreMeta<S>).subscribe(data => {
      /**
       * @desc Delay execution in order to get the new listener function after re-rendering.
       * Because the new rendering may result in the listener
       * using new closure variables from within the component,
       * this allows the listener to obtain the latest variable values
       * and execute the correct data logic internally.
       */
      Promise.resolve().then(() => {
        ref.current!.listener(data);
      });
    }, deps, immediate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deps]);
};
