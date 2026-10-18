import type { DeepReadonly, PrimitiveState } from "../types";

/** Type of unsubscribe */
export type Unsubscribe = () => void;

/**
 * The parameter type of the subscription listening function
 * @description subscribe possesses the characteristic scheduling mechanism of Resy itself,
 * as well as the ability to handle batch updates.
 * effectState is the data state for a batch change,
 * while prevState and nextState represent the data states before and after a batch change.
 *
 * 🌟 All three fields are deeply read-only snapshots at the type level. They are
 * raw references at runtime, so mutating them would rewrite the current tree or
 * the history instead of committing through the store.
 */
export type ListenerParams<S extends PrimitiveState> = {
  effectState: DeepReadonly<Partial<S>>;
  nextState: DeepReadonly<S>;
  prevState: DeepReadonly<S>;
};

/** Type of monitoring callback for subscription */
export type ListenerType<S extends PrimitiveState> = (data: ListenerParams<S>) => void;

/** Type of subscribe */
export type SubscribeType<S extends PrimitiveState> = {
  /**
   * @param listener Subscription function callback
   * @param stateKeys Subscription dependent data attribute array
   * @param immediate Should callback be executed immediately upon subscription establishment
   * @return unsubscribe
   */
  subscribe(
    listener: ListenerType<S>,
    stateKeys?: (keyof S)[],
    /** @default undefined */
    immediate?: boolean,
  ): Unsubscribe;
};

// Internal ref type of useSubscription
export type SubscriptionRefType<S extends PrimitiveState> = {
  listener: ListenerType<S>;
  stateKeys?: (keyof S)[];
};

/**
 * type of useSubscription
 * @description It`s advantage is that you only need to consider the data you want to subscribe to,
 * rather than the psychological burden to consider whether the data reference inside the function can get the latest value.
 * UseSubscription will reduce your mental burden and allow you to use it normally.
 * @param store Subscription Store Object
 * @param listener Subscription function callback
 * @param stateKeys Subscription dependent data attribute array
 * @param immediate Should callback be executed immediately upon subscription establishment
 */
export interface UseSubscriptionType<S extends PrimitiveState> {
  useSubscription(
    listener: ListenerType<S>,
    stateKeys?: (keyof S)[],
    /** @default undefined */
    immediate?: boolean,
  ): void;
}
