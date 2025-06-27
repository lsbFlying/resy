import type { Callback, PrimitiveState } from "../types";
import type { StateCallback } from "../updater/types";
import type StoreMeta from "../store/core";
import type Scheduler from "../scheduler";
import type Subscriber from "../subscribe";
import type Updater from "../updater";
import { hasOwnProperty } from "../utils";

export default class Restorer<S extends PrimitiveState> {
  constructor(
    public $storeMeta: StoreMeta<S>,
    public $scheduler: Scheduler<S>,
    public $subscriber: Subscriber<S>,
    public $updater: Updater<S>,
  ) {
    $storeMeta.restore = this.restore;
  }

  // Tag counters for data references of store
  stateMetaRefCounter = 0;

  /**
   * @description Flag indicating that the initialStateRetrieve function is executable.
   * If initialState is a function,
   * you can get the execution flag in the initialStateRetrieve handler of useStore.
   */
  initialFunctionExecutable?: boolean;

  /**
   * Retrieve the reducerState
   * @description If the data is in the initialization state and returned by a function,
   * the initialization function must be executed again.
   * This ensures that the retrieved internal initialization data aligns with the function's logic.
   * For example, if the initialization function's return includes time in milliseconds,
   * it is important to re-execute the function to acquire the most up-to-date initialization data.
   * Such caution ensures the precision of data recovery.
   */
  retrieveReducerState = () => {
    const { _initialState_ } = this.$storeMeta;
    return typeof _initialState_ === "function"
      ? (_initialState_() as S)
      : (_initialState_ ?? ({} as S));
  };

  // Logic of recovery processing
  restoreProcessing = () => {
    this.$storeMeta._$state_ = { ...this.retrieveReducerState() } as S;

    // this.#freezing = true;
  };

  /** restore utils start */
  // Retrieve recovery processing when initialState is a function
  initialStateRetrieve = () => {
    // unfreeze for normal rendering updates
    // this.#freezing = undefined;

    // The relevant judgment logic is similar to unmountRestore.
    if (this.initialFunctionExecutable) {
      this.initialFunctionExecutable = undefined;
      this.restoreProcessing();
    }
  };

  /**
   * @description In order to prevent the double rendering in React's StrictMode
   * from causing issues with the registration function returned in useEffect,
   * it happens to be opportune for stateMetaMap to release memory preemptively
   * during the first unmount execution.
   * (with memory release being performed in the callback).
   * This early release of memory removes the previous state-meta,
   * and any subsequent updates or renderings will regenerate a new state-meta.
   * However, this process leads to the updater function's stateChangeQueue
   * within state-meta referencing the address of the previously outdated state-meta.
   * Meanwhile, that old stateChangeQueue has already been deleted.
   * and cleared with the early release of the state-meta's memory,
   * leading to the updater function's incapability to make valid updates.
   * Here, to ensure operations such as unmount, freeing memory,
   * and unmountRestore run smoothly,
   * a microtask can be used to postpone the unmount process.
   */
  deferRestoreProcessing = (callback?: Callback) => {
    const scheduler = this.$scheduler;
    if (!scheduler.deferEffectDestructorExecutable) {
      scheduler.deferEffectDestructorExecutable = Promise.resolve().then(() => {
        scheduler.deferEffectDestructorExecutable = undefined;
        const { stateMetaRefCounter } = this;
        const classInstanceStack = this.$updater.classInstanceStack;
        if (!stateMetaRefCounter && !classInstanceStack.size) {
          /**
           * By using "stateRefCounter" and "classInstanceStack",
           * we determine whether the store still has component references.
           * As long as there is at least one component referencing,
           * the data will not be reset since it is currently in use within the business logic
           * and does not constitute a complete unmount.
           * The complete unmount cycle corresponds to the entire usage cycle of the store.
           */
          const noRef = !classInstanceStack.size && !stateMetaRefCounter;
          const initialState = this.$storeMeta._initialState_;
          /**
           * When initialState is a function,
           * it does not have to be executed at unmount time,
           * because initialization time is sure to reset execution,
           * thus optimizing code execution efficiency.
           */
          this.$storeMeta._options_.unmountRestore
          && noRef
          && typeof initialState !== "function"
          && this.restoreProcessing();

          typeof initialState === "function" && noRef && (this.initialFunctionExecutable = true);
        }
        callback?.();
      });
    }
  };
  /** restore utils end */

  // Reset recovery initialization state data
  restore = (callback?: StateCallback<S>) => {
    const { _$state_ } = this.$storeMeta;
    const { pushTask, finallyBatchProcessing } = this.$updater;

    this.$subscriber.willUpdatingProcessing();

    const reducerState = this.retrieveReducerState();
    console.log("reducerState:", reducerState);

    /**
     * @description Get all the properties
     * Here we merge the data attributes of the current "$state" and the initial "reducerState"
     * in order to count all the new or deleted attributes.
     * It is convenient to use the hasOwnProperty method
     * to check whether the 'reducerState' has a specific data attribute before restoring the data.。
     * Thinking backwards,
     * if we don't aggregate all the keys,
     * then we can only perform the traversal of keys based on either 'reducerState' or '$state',
     * and restore them based on whether they have properties confirmed by the hasOwnProperty method.
     * If we choose reducerState, we will not be able to control the newly added key,
     * and if we choose $state, we will not be able to delete the key.
     * Neither of them is perfect, so we must merge both sets of results.
     */
    Array.from(
      new Set(
        (
          Object.keys(reducerState) as (keyof S)[]
        ).concat(
          Object.keys(_$state_)
        )
      )
    ).forEach(key => {
      const originValue = reducerState[key];

      !Object.is(originValue, _$state_[key])
      && pushTask(key, originValue, !hasOwnProperty.call(reducerState, key));
    });

    this.$scheduler.pushCallback({} as S, reducerState, callback);

    finallyBatchProcessing();
  };
}
