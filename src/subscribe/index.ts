import type { PrimitiveState } from "../types";
import type { ListenerType, Unsubscribe } from "./types";
import type { Store } from "../store/types";
import type StoreMeta from "../store/core";
import type Scheduler from "../scheduler";
import { subscribeErrorProcessing } from "../store/errors";
import { useDebugValue } from "react";
import { useSubscription as useSubscriptionCore } from "./hook";

export default class Subscriber<S extends PrimitiveState> {
  constructor(
    public $storeMeta: StoreMeta<S>,
    public $scheduler: Scheduler<S>,
  ) {
    $storeMeta.subscribe = this.subscribe;
    $storeMeta.useSubscription = this.useSubscription;
  }

  // Data status of the previous update batch for subscriber
  prevBatchState!: S;

  // Subscription listener queue
  readonly listenerQueue = new Set<ListenerType<S>>();

  /**
   * @description Pre-update processing
   * records the prevState beforehand for later comparison
   * when data changes trigger Subscriber.
   */
  willUpdatingProcessing = () => {
    const scheduler = this.$scheduler;
    if (this.listenerQueue.size > 0 && !scheduler.willUpdating) {
      scheduler.willUpdating = true;
      this.prevBatchState = { ...this.$storeMeta._$state_ } as S;
    }
  };

  // Subscription function
  subscribe = (
    listener: ListenerType<S>,
    stateKeys?: (keyof S)[],
    immediate?: boolean,
  ): Unsubscribe => {
    if (immediate) {
      const nextState = this.$storeMeta._$state_;
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
    const listenerQueue = this.listenerQueue;

    subscribeErrorProcessing(listener, stateKeys);

    const listenerWrap: ListenerType<S> = data => {
      Object.keys(data.effectState).some(key => stateKeys!.includes(key)) && listener(data);
    };

    const hasListenerKeys = !stateKeys?.length;

    hasListenerKeys
      ? listenerQueue.add(listener)
      : listenerQueue.add(listenerWrap);

    // Returns the unsubscribing function, which allows the user to choose whether or not to unsubscribe,
    // because it is also possible that the user wants the subscription to remain in effect.
    return () => {
      hasListenerKeys
        ? listenerQueue.delete(listener)
        : listenerQueue.delete(listenerWrap);
    };
  };

  useSubscription = (
    listener: ListenerType<S>,
    stateKeys?: (keyof S)[],
    immediate?: boolean,
  ) => {
    if (__DEV__) {
      const { _options_: { namespace } } = this.$storeMeta;
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
    useSubscriptionCore(this.$storeMeta as any as Store<S>, listener, stateKeys, immediate);
  };
}
