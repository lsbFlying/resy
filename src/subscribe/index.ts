import type { PrimitiveState } from "../types";
import type { ListenerType, Unsubscribe } from "./types";
import type StoreMeta from "../store/core";
import type { Store } from "../store/types";
import { effectStateInListenerKeys } from "../store/helpers";
import { subscribeErrorProcessing } from "../store/errors";
import { __DEV__ } from "../static";
import { useDebugValue } from "react";
import { useSubscription as useSubscriptionCore } from "./hook";

export default class Subscriber<S extends PrimitiveState> {
  constructor(public storeMetaInstance: StoreMeta<S>) {
    this.prevBatchState = Object.assign({}, storeMetaInstance._reducerState_);
  }

  // Data status of the previous update batch
  prevBatchState: S;

  // Subscription listener queue
  listenerQueue = new Set<ListenerType<S>>();

  /**
   * @description Pre-update processing
   * records the prevState beforehand for later comparison
   * when data changes trigger Subscriber.
   */
  willUpdatingProcessing = () => {
    const scheduler = this.storeMetaInstance._scheduler_;
    if (this.listenerQueue.size > 0 && !scheduler.willUpdating) {
      scheduler.willUpdating = true;
      this.prevBatchState = Object.assign({}, this.storeMetaInstance.$state) as S;
    }
  };

  // Subscription function
  subscribe = (listener: ListenerType<S>, stateKeys?: (keyof S)[]): Unsubscribe => {
    const listenerQueue = this.listenerQueue;

    subscribeErrorProcessing(listener, stateKeys);

    const listenerWrap: ListenerType<S> = data => {
      effectStateInListenerKeys(data.effectState, stateKeys) && listener(data);
    };

    listenerQueue.add(listenerWrap);

    // Returns the unsubscribing function, which allows the user to choose whether or not to unsubscribe,
    // because it is also possible that the user wants the subscription to remain in effect.
    return () => listenerQueue.delete(listenerWrap as ListenerType<S>);
  };

  useSubscription = (listener: ListenerType<S>, stateKeys?: (keyof S)[]) => {
    if (__DEV__) {
      const { _options_: { namespace } } = this.storeMetaInstance;
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
    useSubscriptionCore(this.storeMetaInstance as any as Store<S>, listener, stateKeys);
  };
}
