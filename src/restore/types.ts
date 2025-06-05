import type { StateCallback } from "../updater/types";
import type { PrimitiveState } from "../types";

/** Type of restore */
export type RestoreType<S extends PrimitiveState> = {
  /**
   * @param callback
   * @description The reason for not naming it reset is due to
   * the consideration of scenarios where the createStore parameter might be a function.
   * In such cases, logically speaking, it's not so much about resetting but rather about restoring.
   * As for what state it restores to depends on the result returned by the execution of the initialization function.
   * Hence, the choice of the name restore instead of reset.
   */
  restore(callback?: StateCallback<S>): void;
};
