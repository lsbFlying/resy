import type { PrimitiveState, ValueOf } from "../types";
import type { State, StateCallback, StateFnType } from "./types";
import type { ApplyOriginFunctionType, KeyChainsSourceItemType } from "../immutable/types";
import type { ComponentWithStore } from "../class-connect";
import type StoreMeta from "../store/core";
import { batchUpdate } from "../static";
import { stateErrorProcessing } from "../store/errors";
import { createNewRefValue, reduceChanged } from "../immutable/utils";

/**
 * @description Update mechanism class
 */
export default class Updater<S extends PrimitiveState> {
  // eslint-disable-next-line no-empty-function
  constructor(public storeMetaInstance: StoreMeta<S>) {}

  // The storage stack of this instance for the class component
  readonly _classInstanceStack_ = new Set<ComponentWithStore<{}, S>>();

  pushTask = (key: keyof S, value: ValueOf<S>, isDelete?: boolean) => {
    const state = this.storeMetaInstance.$state;
    /**
     * @description The pre-execution of the data changes accumulates
     * the logic of the correct execution of the final update,
     * which lays the foundation for subsequent batch updates.
     */
    !isDelete ? (state[key] = value) : delete state[key];

    this.storeMetaInstance._scheduler_.pushTask(
      key,
      value,
      () => {
        // State updates for class components
        this.classUpdater(key, value);
        /**
         * @description The decision not to execute the updates for class components within the following updater
         * is to preserve the simplicity of the update scheduling for both hook and class components.
         */
        // State updates for hook components
        this.storeMetaInstance._getStateMeta_(key)!.updater();
      },
    );
  };

  finallyBatchProcessing = () => {
    const listenerQueue = this.storeMetaInstance._subscriber_.listenerQueue;
    const scheduler = this.storeMetaInstance._scheduler_;
    const {
      taskData, taskQueue, callbackQueue,
    } = scheduler;

    if ((taskQueue.size > 0 || callbackQueue.size > 0) && !scheduler.isUpdating) {
      // Reduce the generation of redundant microtasks through the isUpdating flag
      scheduler.isUpdating = Promise.resolve().then(() => {
        /**
         * @description Reset the isUpdating and willUpdating flags
         * to ensure that each subsequent round of update batching can proceed and operate normally.
         */
        scheduler.isUpdating = undefined;
        scheduler.willUpdating = undefined;

        batchUpdate(() => {
          // Perform update task
          taskQueue.forEach(task => {
            task();
          });

          // Make a shallow clone of the "taskDataMap" data for the "effectState" of "subscribe",
          // Perform a shallowClone before executing flushTask, otherwise, it might become impossible to retrieve `taskDataMap`.
          const effectStateTemp = listenerQueue.size > 0
            ? Object.assign({}, taskData)
            : undefined;

          /**
           * @description So far, the task of this round of data updates is complete.
           * The task data and task queue are immediately flushed and cleared,
           * freeing up space in preparation for the next round of data updates.
           */
          scheduler.flushTask();

          // 🌟 The execution of subscribe and callback needs to be placed after flush,
          // otherwise their own update queues will be emptied in advance, affecting their own internal execution.

          // Trigger the execution of the callback function
          if (callbackQueue.size > 0) {
            callbackQueue.forEach(({ callback, nextState }) => {
              callback(nextState);
            });
            callbackQueue.clear();
          }

          // 🌟 As logically, the listener in subscribe needs to be executed after the callback has been executed.

          // Trigger the execution of subscription snooping
          if (listenerQueue.size > 0) {
            listenerQueue.forEach(item => {
              // the clone returned by mapToObject ensures that the externally subscribed data
              // maintains it`s purity and security as much as possible in terms of usage.
              item({
                effectState: effectStateTemp!,
                nextState: this.storeMetaInstance.$state,
                prevState: this.storeMetaInstance._subscriber_.prevBatchState,
              });
            });
          }
        });
      });
    }
  };

  setState = (state: State<S> | StateFnType<S>, callback?: StateCallback<S>) => {
    this.storeMetaInstance._subscriber_.willUpdatingProcessing();

    const _state_ = this.storeMetaInstance.$state;

    let stateTemp = state;

    // processing of prevState
    typeof state === "function" && (stateTemp = (state as StateFnType<S>)(Object.assign({}, _state_)));

    if (stateTemp !== null) {
      stateErrorProcessing({ state: stateTemp, fnName: "setState" });
      // The update of hook is an independent update dispatch action, and traversal processing is needed to unify the stack.
      Object.keys(stateTemp as NonNullable<State<S>>).forEach(key => {
        const value = (stateTemp as S)[key];
        if (!Object.is(value, _state_[key])) {
          this.pushTask(key, value);
        }
      });
    }

    this.storeMetaInstance._scheduler_.pushCallback(_state_, stateTemp as State<S>, callback);

    this.finallyBatchProcessing();
  };

  /**
   * @description syncUpdate primarily exists to address issues with normal text input.
   * to meet the needs of normal text input, it synchronizes React's update scheduling.
   */
  syncUpdate = (state: State<S> | StateFnType<S>, callback?: StateCallback<S>) => {
    const _state_ = this.storeMetaInstance.$state;

    let stateTemp = state;

    typeof state === "function" && (stateTemp = (state as StateFnType<S>)(Object.assign({}, _state_)));

    if (stateTemp !== null) {
      stateErrorProcessing({ state: stateTemp, fnName: "syncUpdate" });
      batchUpdate(() => {
        Object.keys(stateTemp as NonNullable<State<S>>).forEach((key: keyof S) => {
          const value = (stateTemp as S)[key];
          if (!Object.is(_state_[key], value)) {
            _state_[key] = value;
            this.classUpdater(key, value);
            this.storeMetaInstance._getStateMeta_(key)!.updater();
          }
        });
      });
    }

    this.storeMetaInstance._scheduler_.pushCallback(_state_, stateTemp as State<S>, callback);

    this.finallyBatchProcessing();
  };

  // Data updates for a single attribute (state-meta)
  updateStateMeta = (
    key: keyof S,
    value: ValueOf<S>,
    isDelete = false,
    target: object | S = this.storeMetaInstance.$state,
    firstLevelKey?: keyof S,
    keyChains?: Set<KeyChainsSourceItemType<S>>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _applyOriginFunction?: ApplyOriginFunctionType, // TODO waiting develop
  ): boolean => {
    // if (this.#freezing) return true;

    const state = this.storeMetaInstance.$state;

    // mutate chain update
    if (firstLevelKey) {
      // During each update, the target here is the latest target object obtained by the previous agent,
      // so the PrevValue here is also the latest data before the update.
      const prevValue = (target as S)[key];

      // Directly compare the PrevValue with the current value to be updated
      // to see if the data needs to be updated and processed.
      const changed = !Object.is(prevValue, value);

      const firstLevelValue = state[firstLevelKey!];

      changed && reduceChanged(value, keyChains!, firstLevelValue);

      return changed
        ? this.updateStateMeta(
          firstLevelKey!,
          /**
           * @description When performing updates on the first-level attributes here,
           * a reference update is required. Without a reference update,
           * the incremental processing of `noneFirstLevelKeyChains` and `firstLevelValue` in the preceding `reduce` function
           * will result in no actual change to the references.
           * Consequently, when reaching the "else" branch
           * and executing the logic of `if (!Object.is(value, $state[key]))`,
           * it will show that the previous and current values are equal,
           * ultimately leading to the update being skipped.
           */
          createNewRefValue(firstLevelValue) as ValueOf<S>,
          isDelete,
          state,
        )
        : true;
    } else {
      if (!Object.is(value, state[key])) {
        this.storeMetaInstance._subscriber_.willUpdatingProcessing();
        this.pushTask(key, value, isDelete);
        this.finallyBatchProcessing();
      }
      return true;
    }
  };

  // For class components
  classUpdater = (key: keyof S, value: ValueOf<S>) => {
    const classInstanceStack = this._classInstanceStack_;
    classInstanceStack.forEach(classInstanceItem => {
      /**
       * There is an "updater" attribute on the internal this pointer of react's class,
       * and an "isMounted" method is mounted on it to determine whether the component has been loaded.
       * If it is in "React.StrictMode" mode,
       * React will discard the first generated instance and the instance will not be mounted.
       */
      classInstanceItem._$isMounted_
        /**
         * @description Determine whether the currently updated data property
         * is used in the class component, and if not, do not update it.
         * 🌟 Don't worry about the use of hidden attributes caused by operations such as ternary operators.
         * Even the use of hidden attributes here will not cause rendering problems,
         * because the state attribute reference of the class component does not have a hook rule.
         * At the same time, when a hidden attribute is discovered by a new rendering,
         * it will immediately generate a new state attribute reference.
         * Therefore, this is always safe, and it can avoid unnecessary re-renders.
         * 🌟 Adding "?.has" is to prevent some class components from making an empty connection,
         * that is, connecting to the store but not using it. Generally speaking, this is not done,
         */
        ? classInstanceItem._$stateRefs_?.has(key)
          && classInstanceItem.setState({ [key]: value } as Pick<S, keyof S>)
        : classInstanceStack.delete(classInstanceItem);
    });
  };
}
