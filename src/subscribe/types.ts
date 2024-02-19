import type { Callback, PrimitiveState } from "../types";

/** Type of unsubscribe */
export type Unsubscribe = Callback;

/**
 * The parameter type of the subscription listening function
 * @description subscribe possesses the characteristic scheduling mechanism of Resy itself,
 * as well as the ability to handle batch updates.
 * effectState is the data state for a batch change,
 * while prevState and nextState represent the data states before and after a batch change.
 */
export type ListenerParams<S extends PrimitiveState> = {
  effectState: Readonly<Partial<S>>;
  nextState: Readonly<S>;
  prevState: Readonly<S>;
};

/** Type of monitoring callback for subscription */
export type ListenerType<S extends PrimitiveState> = (data: ListenerParams<S>) => void;

/** Type of subscribe */
export type Subscribe<S extends PrimitiveState> = Readonly<{
  /**
   * @param listener
   * @param stateKeys Array of monitored data attributes
   * @return unsubscribe
   */
  subscribe(
    listener: ListenerType<S>,
    stateKeys?: (keyof S)[],
  ): Unsubscribe;
}>;
