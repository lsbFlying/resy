import type MetaStore from "../store/core";
import type { PrimitiveState } from "../types";
import type { ListenerParams, ListenerType, SubscribeType, SubscriptionRefType, Unsubscribe } from "./types";
import { subscribeErrorProcessing } from "../store/errors";
import { useDebugValue, useEffect, useRef, useState } from "react";

export default class Subscriber<S extends PrimitiveState> {
  constructor(public $metaStore: MetaStore<S>) {
    $metaStore.subscribe = this.subscribe as SubscribeType<S>["subscribe"];
    $metaStore.useSubscription = this.useSubscription;
  }

  // Data status of the previous update batch for subscriber
  prevBatchState!: S;

  // Subscription listener queue
  readonly listenerQueue = new Set<ListenerType<S>>();
  // The state subscription listening function queue of useSyncExternalStore
  readonly onStateChangeQueue = new Set<ListenerType<S>>();

  /**
   * @description Pre-update processing
   * records the prevState beforehand for later comparison
   * when data changes trigger Subscriber.
   */
  willUpdatingProcessing() {
    const scheduler = this.$metaStore._scheduler_;
    if (this.listenerQueue.size > 0 && !scheduler.willUpdating) {
      scheduler.willUpdating = true;
      this.prevBatchState = { ...this.$metaStore._$state_ } as S;
    }
  }

  /**
   * @desc Subscription function.
   * When the stateKey parameter type is Set,
   * it is prepared for `onStateChangeQueue` subscription listening.
   */
  subscribe = (
    listener: ListenerType<S>,
    stateKeys?: (keyof S)[] | Set<keyof S>,
    immediate?: boolean,
  ): Unsubscribe => {
    if (immediate) {
      const nextState = this.$metaStore._$state_;
      const effectState = {} as Partial<S>;
      stateKeys?.forEach(key => {
        effectState[key] = nextState[key];
      });
      listener({
        effectState,
        nextState,
        prevState: this.prevBatchState,
      });
    }

    const stateChangeSubscribeFlag = stateKeys instanceof Set;
    const listenerQueue = stateChangeSubscribeFlag ? this.onStateChangeQueue : this.listenerQueue;

    subscribeErrorProcessing(listener, stateKeys);

    const listenerWrap = (data: ListenerParams<S>) => {
      const effectKeys = Object.keys(data.effectState);

      let changed = false;
      const keysLength = effectKeys.length;

      for (let i = 0; i < keysLength; i++) {
        const key = effectKeys[i];
        if (stateChangeSubscribeFlag ? stateKeys.has(key) : stateKeys!.includes(key)) {
          changed = true;
          break;
        }
      }

      changed && listener(data);
    };

    const noneListenerKeys = !((stateKeys as Set<keyof S>)?.size || (stateKeys as (keyof S)[])?.length);

    noneListenerKeys
      ? listenerQueue.add(listener)
      : listenerQueue.add(listenerWrap);

    // Returns the unsubscribing function, which allows the user to choose whether or not to unsubscribe,
    // because it is also possible that the user wants the subscription to remain in effect.
    return () => {
      noneListenerKeys
        ? listenerQueue.delete(listener)
        : listenerQueue.delete(listenerWrap);
    };
  };

  /**
   * @description Hook of subscribe
   * @param listener Subscription function callback
   *
   * @param stateKeys Subscription dependent data attribute array
   * @default undefined
   *
   * @param immediate Should callback be executed immediately upon subscription establishment
   * @default undefined
   */
  useSubscription = (
    listener: ListenerType<S>,
    stateKeys?: (keyof S)[],
    immediate?: boolean,
  ) => {
    subscribeErrorProcessing(listener, stateKeys);

    if (__DEV__) {
      const namespace = this.$metaStore._options_.namespace;
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

    // eslint-disable-next-line react-hooks/rules-of-hooks
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

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [deps, updateDeps] = useState(() => stateKeys);

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => () => {
      updateDeps(ref.current?.stateKeys);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, stateKeys);

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      return this.subscribe(data => {
        /**
         * @desc Delay execution in order to get the new listener function after re-rendering.
         * Because the new rendering may result in the listener
         * using new closure variables from within the component,
         * this allows the listener to obtain the latest variable values
         * and execute the correct data logic internally.
         */
        Promise.resolve().then(() => {
          ref.current!.listener(data as ListenerParams<S>);
        });
      }, deps, immediate);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [deps]);
  };
}
