import type { PrimitiveState } from "../types";
import type { ListenerType, Unsubscribe } from "./types";
import type { Store } from "../store/types";
import type StoreMeta from "../store/core";
import { __DEV__ } from "../static";
import { subscribeErrorProcessing } from "../store/errors";
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

  /**
   * @description Determine whether the current change data is within the monitoring range of stateKeys
   * @return boolean
   */
  effectStateInListenerKeys = <S extends PrimitiveState>(
    effectState: Readonly<Partial<S>>,
    stateKeys?: (keyof S)[],
  ) => {
    let effectExecFlag = false;
    const listenerKeysExist = stateKeys && stateKeys?.length > 0;
    /**
     * @description In fact, when the final subscription is triggered,
     * each of these outer layer listenerWraps subscribed is activated.
     * It's just that here, the execution of the inner listener is contingent upon a data change check,
     * which then determines whether the listener in subscribe should be executed.
     */
    if (
      (
        listenerKeysExist
        && Object.keys(effectState).some(key => stateKeys.includes(key))
      ) || !listenerKeysExist
    ) {
      effectExecFlag = true;
    }
    return effectExecFlag;
  };

  // Subscription function
  subscribe = (listener: ListenerType<S>, stateKeys?: (keyof S)[]): Unsubscribe => {
    const listenerQueue = this.listenerQueue;

    subscribeErrorProcessing(listener, stateKeys);

    const listenerWrap: ListenerType<S> = data => {
      this.effectStateInListenerKeys(data.effectState, stateKeys) && listener(data);
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
