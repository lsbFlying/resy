import type { PrimitiveState, ValueOf } from "../types";
import type { State, StateCallback, StateFnType } from "./types";
import type { ApplyOriginFunctionType, KeyChainsSourceItemType } from "../immutable/types";
import type { ComponentWithStore } from "../class-connect";
import type MetaStore from "../store/core";
import { batchUpdate } from "../static";
import { stateErrorProcessing } from "../store/errors";
import { createNewRefValue, reduceChanged } from "../immutable/utils";
import { isEmptyPureObject } from "../utils";

/**
 * @description Update mechanism of `meta-state`
 */
export default class Updater<S extends PrimitiveState> {
  constructor(public $metaStore: MetaStore<S>) {
    $metaStore.setState = this.setState;
    $metaStore.syncUpdate = this.syncUpdate;
  }

  // The storage stack of this instance for the class component
  readonly classInstanceStack = new Set<ComponentWithStore<{}, S>>();

  callbackAndSubscribeProcessing(effectState: S) {
    const {
      _scheduler_, _$state_,
      _subscriber_: { listenerQueue, prevBatchState },
    } = this.$metaStore;

    const { callbackQueue } = _scheduler_;

    if (callbackQueue.size > 0) {
      callbackQueue.forEach(item => {
        const { callback, nextState } = item;
        /**
         * @desc In order to prevent a synchronous endless loop caused by the execution
         * of the callback function in the `syncUpdate` synchronous update function
         * from generating new states updates, here we first talk about temporarily storing the callback function,
         * and the immediately removing the current callbackQueue element.
         */
        const callbackTemp = callback;
        callbackQueue.delete(item);
        callbackTemp(nextState);
      });
    }

    /**
     * @desc 🌟 As logically,
     * the listener in subscribe needs to be executed after the callback has been executed.
     * Trigger the execution of subscription snooping
     */
    if (listenerQueue.size > 0 && !isEmptyPureObject(effectState)) {
      listenerQueue.forEach(item => {
        item({
          /**
           * @desc Even if 'scheduler. flushTask()' clears taskData,
           * it directly assigns new values to taskData within the scheduler,
           * making it easier to trace the old taskData as a snapshot variable.
           */
          effectState,
          nextState: _$state_,
          prevState: prevBatchState,
        });
      });
    }
  }

  batchUpdateProcessingCore() {
    const { $metaStore } = this;
    const { _scheduler_ } = $metaStore;

    /**
     * @description Reset the isUpdating and willUpdating flags
     * to ensure that each subsequent round of update batching can proceed and operate normally.
     */
    _scheduler_.isUpdating = undefined;
    _scheduler_.willUpdating = undefined;

    batchUpdate(() => {
      const { taskData } = _scheduler_;

      this.update(taskData);

      /**
       * @description So far, the task of this round of data updates is complete.
       * The task data and task queue are immediately flushed and cleared,
       * freeing up space in preparation for the next round of data updates.
       * 🌟 And there may be a next round of status updates in callbacks and subscriptions,
       * so 'flushTask' needs to be executed before callbacks and subscriptions
       * 🌟 The execution of subscribe and callback needs to be placed after flush,
       * otherwise their own update queues will be emptied in advance,
       * affecting their own internal execution.
       */
      _scheduler_.flushTask();

      this.callbackAndSubscribeProcessing(taskData);
    });
  }

  finallyBatchProcessing() {
    const scheduler = this.$metaStore._scheduler_;
    const { taskData, callbackQueue } = scheduler;

    if ((!isEmptyPureObject(taskData) || callbackQueue.size > 0) && !scheduler.isUpdating) {
      // Reduce the generation of redundant microtasks through the isUpdating flag
      scheduler.isUpdating = Promise.resolve().then(() => {
        this.batchUpdateProcessingCore();
      });
    }
  }

  setState = (state: State<S> | StateFnType<S>, callback?: StateCallback<S>) => {
    const { $metaStore: { _$state_, _subscriber_, _scheduler_ } } = this;
    _subscriber_.willUpdatingProcessing();

    let stateTemp = state;

    // processing of prevState
    typeof state === "function" && (stateTemp = (state as StateFnType<S>)({ ..._$state_ }));

    if (stateTemp !== null) {
      stateErrorProcessing({ state: stateTemp, fnName: "setState" });
      // The update of hook is an independent update dispatch action,
      // and traversal processing is needed to unify the stack.
      Object.keys(stateTemp as NonNullable<State<S>>).forEach(key => {
        const value = (stateTemp as S)[key];
        if (!Object.is(value, _$state_[key])) {
          _scheduler_.pushTask(key, value);
        }
      });
    }

    _scheduler_.pushCallback(_$state_, stateTemp as State<S>, callback);

    this.finallyBatchProcessing();
  };

  /**
   * @description syncUpdate primarily exists to address issues with normal text input.
   * to meet the needs of normal text input, it synchronizes React's update scheduling.
   */
  syncUpdate = (state: State<S> | StateFnType<S>, callback?: StateCallback<S>) => {
    const { $metaStore } = this;
    const { _$state_, _scheduler_ } = $metaStore;

    let stateTemp = state;

    typeof state === "function" && (stateTemp = (state as StateFnType<S>)({ ..._$state_ }));

    if (stateTemp !== null) {
      stateErrorProcessing({ state: stateTemp, fnName: "syncUpdate" });

      batchUpdate(() => {
        const effectState = {} as S;

        Object.keys(stateTemp as NonNullable<State<S>>).forEach((key: keyof S) => {
          const value = (stateTemp as S)[key];
          if (!Object.is(_$state_[key], value)) {
            $metaStore._$state_ = {
              ...$metaStore._$state_,
              [key]: value,
            };

            effectState[key] = value;
          }
        });

        this.update(effectState);

        _scheduler_.pushCallback(_$state_, stateTemp as State<S>, callback);

        this.callbackAndSubscribeProcessing(effectState);
      });
    }
  };

  // Data updates for a single attribute (meta-state)
  updateMetaState(
    key: keyof S,
    value: ValueOf<S>,
    isDelete = false,
    target: object | S = this.$metaStore._$state_,
    firstLevelKey?: keyof S,
    keyChains?: Set<KeyChainsSourceItemType<S>>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _applyOriginFunction?: ApplyOriginFunctionType, // TODO waiting develop
  ): boolean {
    // if (this.#freezing) return true;

    const { $metaStore: { _$state_, _scheduler_, _subscriber_ } } = this;

    // mutate chain update
    if (firstLevelKey) {
      // During each update, the target here is the latest target object obtained by the previous agent,
      // so the PrevValue here is also the latest data before the update.
      const prevValue = (target as S)[key];

      // Directly compare the PrevValue with the current value to be updated
      // to see if the data needs to be updated and processed.
      const changed = !Object.is(prevValue, value);

      const firstLevelValue = _$state_[firstLevelKey!];

      changed && reduceChanged(value, keyChains!, firstLevelValue);

      return changed
        ? this.updateMetaState(
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
          _$state_,
        )
        : true;
    } else {
      if (!Object.is(value, _$state_[key])) {
        _subscriber_.willUpdatingProcessing();
        _scheduler_.pushTask(key, value, isDelete);
        this.finallyBatchProcessing();
      }
      return true;
    }
  }

  update(effectState: S) {
    const { _subscriber_: { onStateChangeQueue } } = this.$metaStore;
    // Perform update task（update hook component）
    onStateChangeQueue.forEach(stateChangeWrap => {
      stateChangeWrap(effectState);
    });

    // Perform update task（update class component）
    const classInstanceStack = this.classInstanceStack;
    classInstanceStack.forEach(classInstanceItem => {
      /**
       * There is an "updater" attribute on the internal this pointer of react's class,
       * and an "isMounted" method is mounted on it to determine whether the component has been loaded.
       * If it is in "React.StrictMode" mode,
       * React will discard the first generated instance and the instance will not be mounted.
       */
      const { _$isMounted_, _$stateRefs_ } = classInstanceItem;
      if (_$isMounted_) {
        /**
         * @description Determine whether the currently updated data property
         * is used in the class component, and if not, do not update it.
         * 🌟 Don't worry about the use of hidden attributes caused by operations such as ternary operators.
         * Even the use of hidden attributes here will not cause rendering problems,
         * because the state attribute reference of the class component does not have a hook rule.
         * At the same time, when a hidden attribute is discovered by a new rendering,
         * it will immediately generate a new state attribute reference.
         * Therefore, this is always safe, and it can avoid unnecessary re-renders.
         * 🌟 `.has()` for granular updates - skips re-renders for unused state.
         */
        const curClassCompEffectState = {} as S;
        const effectKeys = Object.keys(effectState);
        const effectKeysLength = effectKeys.length;

        for (let i = 0; i < effectKeysLength; i++) {
          const key = effectKeys[i] as keyof S;
          if (_$stateRefs_.has(key)) {
            curClassCompEffectState[key] = effectState[key];
          }
        }

        !isEmptyPureObject(curClassCompEffectState) && classInstanceItem.setState(curClassCompEffectState);
      } else {
        classInstanceStack.delete(classInstanceItem);
      }
    });
  }
}
