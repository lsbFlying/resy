import type { PrimitiveState, ValueOf } from "../types";
import type { State, StateFnType } from "./types";
import type { StatePath } from "../immutable/types";
import type { ComponentWithStore } from "../class-connect";
import type { ListenerParams } from "../subscribe/types";
import type MetaStore from "../store/core";
import { batchUpdate } from "../static";
import { pathErrorProcessing, stateErrorProcessing } from "../store/errors";
import { commitPath } from "../immutable/utils";
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

  batchUpdateProcessingCore() {
    const {
      $metaStore: {
        _scheduler_,  _$state_,
        _subscriber_: { listenerQueue, prevBatchState }
      }
    } = this;
    const { taskData } = _scheduler_;

    /**
     * @description Reset the isUpdating and willUpdating flags
     * to ensure that each subsequent round of update batching can proceed and operate normally.
     */
    _scheduler_.isUpdating = undefined;
    _scheduler_.willUpdating = undefined;

    batchUpdate(() => {
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

      /**
       * @desc 🌟 As logically,
       * the listener in subscribe needs to be executed after the callback has been executed.
       * Trigger the execution of subscription snooping
       */
      if (listenerQueue.size > 0 && !isEmptyPureObject(taskData)) {
        listenerQueue.forEach(item => {
          item({
            /**
             * @desc Even if 'scheduler. flushTask()' clears taskData,
             * it directly assigns new values to taskData within the scheduler,
             * making it easier to trace the old taskData as a snapshot variable.
             */
            effectState: taskData,
            nextState: _$state_,
            prevState: prevBatchState,
          });
        });
      }
    });
  }

  finallyBatchProcessing() {
    const scheduler = this.$metaStore._scheduler_;
    const { taskData } = scheduler;

    if ((!isEmptyPureObject(taskData)) && !scheduler.isUpdating) {
      // Reduce the generation of redundant microtasks through the isUpdating flag
      scheduler.isUpdating = Promise.resolve().then(() => {
        this.batchUpdateProcessingCore();
      });
    }
  }

  setState = (state: State<S> | StateFnType<S>, opts?: { sync: boolean }) => {
    const { sync } = opts || {};

    const { $metaStore: { _subscriber_, _scheduler_ } } = this;
    _subscriber_.willUpdatingProcessing();

    let stateTemp = state;

    // processing of prevState
    typeof state === "function" && (stateTemp = (state as StateFnType<S>)({
      ...this.$metaStore._$state_,
    }));

    if (stateTemp !== null) {
      stateErrorProcessing({ state: stateTemp, fnName: "setState" });

      // The update of hook is an independent update dispatch action,
      // and traversal processing is needed to unify the stack.
      Object.keys(stateTemp as NonNullable<State<S>>).forEach(key => {
        const value = (stateTemp as S)[key];
        // Read the root fresh on every iteration: `commitRoot` replaces it, and
        // committing the next key against the previous root would drop that key
        // from the batch.
        const result = commitPath(this.$metaStore._$state_, [key], value);
        if (result.committed) {
          _scheduler_.commitRoot(result.root, key as keyof S);
        }
      });
    }

    if (!sync) {
      this.finallyBatchProcessing();
    } else {
      this.batchUpdateProcessingCore();
    }
  };

  /**
   * @description syncUpdate primarily exists to address issues with normal text input.
   * to meet the needs of normal text input, it synchronizes React's update scheduling.
   */
  syncUpdate = (state: State<S> | StateFnType<S>) => {
    this.setState(state, { sync: true });
  };

  /**
   * @description Data updates for a single value addressed by its path.
   *
   * The path is the only source of truth: `path[0]` is the first-level key and
   * `path[path.length - 1]` is the written key. The previous value is read from
   * the current root rather than from any proxy closure, so a write performed
   * through a proxy held across a commit still lands on the live location.
   *
   * @returns Always `true`; the return value is retained for the proxy traps.
   */
  updateMetaState(
    path: StatePath,
    value: ValueOf<S>,
    isDelete = false,
  ): boolean {
    // if (this.#freezing) return true;

    const key = path[0] as keyof S;

    /**
     * @description `commitPath` reads the host itself and reports *why* it
     * refused, so a single call turns a write into a new root.
     *
     * A path whose host is not penetrable (a class instance, a `Map`/`Set`
     * member, …) cannot be committed. Reporting it in development is required
     * because silently dropping the write is the hardest failure to diagnose;
     * in production the write is a no-op, which keeps the leaf-node contract of
     * the published build. A `Date`'s own mutators never reach here at all — a
     * non-proxyable built-in is returned raw.
     */
    const result = commitPath(this.$metaStore._$state_, path, value, isDelete);

    if (!result.committed) {
      // A write that ran into a value it cannot pass through is reported in
      // development; a path that simply changed nothing stays silent.
      if (result.reason === "leaf") pathErrorProcessing(path, result.host);
      return true;
    }

    /**
     * @description `commitPath` hands back a fresh root only when it applied a
     * change, so a single `committed` check is enough; the batch merges by
     * first-level key.
     *
     * 🌟 `willUpdatingProcessing()` MUST run before the root is installed:
     * it captures the tree that existed before the batch, and doing it after
     * would hand the subscriber an already-updated value as its "previous"
     * state.
     */
    const { _scheduler_, _subscriber_ } = this.$metaStore;
    _subscriber_.willUpdatingProcessing();
    _scheduler_.commitRoot(result.root, key);
    this.finallyBatchProcessing();

    return true;
  }

  update(effectState: S) {
    const { _subscriber_: { onStateChangeQueue } } = this.$metaStore;
    // Perform update task（update hook component）
    onStateChangeQueue.forEach(stateChangeWrap => {
      // StateChangeWrap is not a regular subscription function
      // and can skip passing the prevState and NextState parameters
      stateChangeWrap({ effectState } as ListenerParams<S>);
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
