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
  effectState: Partial<S>;
  nextState: S;
  prevState: S;
};

/** Type of monitoring callback for subscription */
export type Listener<S extends PrimitiveState> = (data: ListenerParams<S>) => void;

/** Type of subscribe */
export type Subscribe<S extends PrimitiveState> = Readonly<{
  /**
   * @param listener
   * @param stateKeys Array of monitored data attributes
   * @return unsubscribe
   */
  subscribe(
    listener: Listener<S>,
    stateKeys?: (keyof S)[],
  ): Unsubscribe;
}>;
