import type { PrimitiveState, ValueOf } from "../types";
import type { State, StateFnType } from "./types";
import type { StatePath } from "../immutable/types";
import type { ComponentWithStore } from "../class-connect";
import type { ListenerParams } from "../subscribe/types";
import type MetaStore from "../store/core";
import { batchUpdate } from "../static";
import { stateErrorProcessing } from "../store/errors";
import { commitPath, isPenetrable, readAtPath } from "../immutable/utils";
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
        // Read the root fresh on every iteration: `assignMergeState` replaces
        // it, and committing the next key against the previous root would drop
        // that key from the batch.
        const currentRoot = this.$metaStore._$state_;
        const newRoot = commitPath(currentRoot, [key], value);
        if (newRoot !== currentRoot) {
          _scheduler_.assignMergeState(newRoot, key as keyof S, value);
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
   * @description Whether the current batch already recorded a change for `key`.
   * Used by the D9 rule: a later no-op write in the same batch still has to
   * assign the root built earlier in that batch.
   */
  hasTask(key: keyof S): boolean {
    return Object.prototype.hasOwnProperty.call(this.$metaStore._scheduler_.taskData, key);
  }

  /**
   * @description Build the next state tree for a write on `path`.
   *
   * A path whose host object is not penetrable (a `Date`, a class instance, a
   * `Map`/`Set` member, …) cannot be committed. In development that is reported
   * as an error, because silently dropping the write is the hardest failure to
   * diagnose; in production the write is a no-op, which keeps the leaf-node
   * contract of the published build. A `Date`'s own mutators are not affected:
   * a non-proxyable built-in is returned raw, so such a call never reaches here.
   */
  #nextRoot(path: StatePath, value: ValueOf<S>, isDelete: boolean): S {
    const root = this.$metaStore._$state_;
    const host = readAtPath(root, path.slice(0, -1));

    if (host !== undefined && !isPenetrable(host)) {
      if (__DEV__) {
        throw new Error(
          `[resy] 无法写入路径 "${path.map(String).join(".")}"：`
          + `其宿主对象不是可穿透的纯对象或数组（收到 ${Object.prototype.toString.call(host)}）。`
          + "不可穿透的类型只能整体替换，不能写入其内部字段。",
        );
      }
      return root;
    }

    return commitPath(root, path, value, isDelete);
  }

  /**
   * @description Record a newly built root in the current batch.
   *
   * `prevState` must be captured *before* `_$state_` is reassigned, otherwise
   * the subscriber would receive an already-updated value as its "previous"
   * state.
   */
  mergeState(newRoot: S, key: keyof S, value: ValueOf<S>): void {
    const { $metaStore: { _scheduler_, _subscriber_ } } = this;
    _subscriber_.willUpdatingProcessing();
    _scheduler_.assignMergeState(newRoot, key, value);
    this.finallyBatchProcessing();
  }

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

    const { $metaStore: { _$state_ } } = this;
    const key = path[0] as keyof S;

    const newRoot = this.#nextRoot(path, value, isDelete);

    /**
     * @description D9 — commit when this write changed something, or when the
     * batch already recorded a change for this key (in which case the root
     * built earlier in the batch must be re-assigned to keep the batch atomic).
     * A first no-op write is skipped entirely, so it never triggers listeners.
     */
    if (newRoot !== _$state_ || this.hasTask(key)) {
      this.mergeState(newRoot, key, value);
    }

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
