import { PrimitiveState } from "../types";

/** Update the data type of the parameter */
export type State<S extends PrimitiveState> = Partial<S> | S | null;

/**
 * The type of update parameter is function parameter
 * @description The presence of prevState is necessary.
 * In complex business updating logic and event loops,
 * being able to directly obtain the previous synchronized state
 * through simple synchronous code is a very smooth and simple method.
 */
export type StateFnType<S extends PrimitiveState> = (prevState: Readonly<S>) => State<S>;

export type SetStateAction<S extends PrimitiveState> = State<S> | StateFnType<S>;

/** Type of setState */
export type SetStateType<S extends PrimitiveState> = {
  /**
   * @param state
   * @param callback
   */
  setState(
    state: SetStateAction<S>,
    callback?: StateCallback<S>,
  ): void;
};

/**
 * Type of callback functions for setState, syncUpdate, and restore
 * @description The existence of the nextState parameter in the callback is also necessary for reasons similar to prevState.
 */
export type StateCallback<S extends PrimitiveState> = (nextState: Readonly<S>) => void;

// Element types of setState, syncUpdate, restore callback execution
export type StateCallbackItem<S extends PrimitiveState> = {
  nextState: S;
  callback: StateCallback<S>;
};

/** Type of syncUpdate */
export type SyncUpdateType<S extends PrimitiveState> = {
  /**
   * @param state
   * @param callback
   */
  syncUpdate(
    state: SetStateAction<S>,
    callback?: StateCallback<S>,
  ): void;
};
