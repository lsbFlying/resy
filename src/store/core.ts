import type {
  AnyBoundFn, InitialState, InnerStoreOptions, State, StateCallback, StateFnType,
  StateWithThisType, Store, StateMetaMapType, StoreOptions, MacroStore, UseMacroStore,
} from "./types";
import type { AnyFn, PrimitiveState, ValueOf } from "../types";
import type { ComponentWithStore } from "../class-connect";
import { ClassStoreType } from "../class-connect/types";
import { optionsErrorProcessing, stateErrorProcessing } from "./errors";
import { __COMPUTED_PREFIX__, __RESY_BRAND__ } from "./static";
import { hasOwnProperty } from "../utils";
import { __DEV__, batchUpdate } from "../static";
import { createNewRefValue, proxyable, reduceChanged } from "../immutable/utils";
import { ApplyOriginFunctionType, KeyChainsSourceItemType } from "../immutable/types";
import { __MAP_SET_PROTOTYPE_PROXYABLE_TARGET__ } from "../immutable";
import { useDebugValue, useEffect, useState } from "react";
import Scheduler from "../scheduler";
import StateMeta from "../state";
import Subscriber from "../subscribe";
import Restorer from "../restore";

/**
 * @description The core meta-structure of store
 */
export default class StoreMeta<S extends PrimitiveState> {
  constructor(initialState?: InitialState<S>, options?: StoreOptions) {
    this._initialState_ = initialState;
    this._reducerState_ = typeof initialState === "function"
      ? initialState()
      : initialState ?? ({} as StateWithThisType<S>);

    optionsErrorProcessing(options);
    this._options_ = options
      ? Object.assign({}, StoreMeta.#DEFAULT_OPTIONS, options)
      : StoreMeta.#DEFAULT_OPTIONS;

    const reducerState = this._reducerState_;

    stateErrorProcessing({ state: reducerState, options: this._options_ });

    this.$state = Object.assign({}, reducerState);

    this.store = this.#createProxy();
  }

  __RESY_BRAND__ = __RESY_BRAND__;

  static #DEFAULT_OPTIONS: InnerStoreOptions = {
    unmountRestore: true,
    namespace: undefined,
    immutable: undefined,
    enableMarcoActionStateful: undefined,
    __useConciseState__: undefined,
    __enableMacros__: undefined,
    __functionName__: "createStore",
  };

  /** ============================== For core constant ready start ============================== */
  readonly _initialState_?: InitialState<S>;
  // Retrieve the reducerState
  _reducerState_: S;
  // configuration
  _options_;

  /**
   * @description Flag indicating that the initialStateRetrieve function is executable.
   * If initialState is a function,
   * you can get the execution flag in the initialStateRetrieve handler of useStore.
   */
  _initialFunctionExecutable_: boolean | undefined;

  $state: S;

  // TODO computedDeps waiting upgrade
  // Dependency Collection for computed
  computedDeps = new Set<keyof S>();

  // The core map meta-structure of stateMeta
  _stateMetaMap_: StateMetaMapType<S> = new Map();

  // The storage stack of this instance for the class component
  _classInstanceStack_ = new Set<ComponentWithStore<any, S>>();
  /** ============================== For core constant ready end ============================== */

  /** ============================== For `Reconciler` —— ( Scheduler、Subscriber、Restorer) start ============================== */
  // scheduler
  _scheduler_ = new Scheduler<S>();

  // subscriber
  _subscriber_ = new Subscriber(this);
  subscribe = this._subscriber_.subscribe;
  useSubscription = this._subscriber_.useSubscription;

  // restorer
  _restorer_ = new Restorer(this);
  restore = this._restorer_.restore;
  // Tag counters for data references of store
  _stateRefCounter_ = 0;
  // After unmount resetting the state (`restoreProcessing` function has been executed),
  // it is in a frozen state where updates are prohibited.
  // TODO waiting considering, the scenes it contains are a bit complex
  // #freezing: boolean | undefined;
  /** ============================== For `Reconciler` —— ( Scheduler、Subscriber、Restorer)  end ============================== */

  /** ============================== For core render start ============================== */
  // A proxy object with the capabilities of updating and data tracking.
  store: Store<S>;

  // Proxy of driver update re-render for useStore
  $engineStore = new Proxy({} as MacroStore<S>, {
    get: (_: S, key: keyof S) => {
      const state = this.$state;

      // Get the latest value
      const value = state[key];

      const sourceFromThis = hasOwnProperty.call(this, key);

      if (!sourceFromThis && typeof value !== "function") {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        __DEV__ && useDebugValue({
          key,
          value,
          ...(
            this._options_.namespace
              ? { namespace: this._options_.namespace }
              : null
          ),
        });

        return this.#getStateMeta(key);
      }

      if (!sourceFromThis && typeof value === "function") {
        // Avoid memory redundancy waste caused by repeated bindings and maintain the function reference address unchanged.
        !(value as AnyBoundFn).__bound__ && this._boundFnProcessing_(key, value);

        const fnStateful = !this._options_.__enableMacros__
          || this._options_.enableMarcoActionStateful;

        const boundFnValue = state[key];

        // eslint-disable-next-line react-hooks/rules-of-hooks
        fnStateful && __DEV__ && useDebugValue({
          key,
          value: boundFnValue,
          ...(
            this._options_.namespace
              ? { namespace: this._options_.namespace }
              : null
          ),
        });

        /**
         * @description Enable function properties to have the ability to update rendering.
         * Placing both the __bound__ and the state's set operation before the #getStateMeta
         * can preemptively avoid the tearing synchronization handling inside useSyncExternalStore,
         * resulting in twice the redundant rendering execution.
         */
        fnStateful && this.#getStateMeta(key);

        return !key.toString().startsWith(__COMPUTED_PREFIX__)
          ? boundFnValue
          // TODO waiting upgrade optimize (暂时应该没有属性依赖记录收集销毁的逻辑问题)
          : () => {
            const { computedDeps } = this;

            const [{ result, stateKeys }, update] = useState(() => {
              // Clear the previous dirty dependencies before collecting them
              computedDeps.clear();
              const res = (boundFnValue as AnyFn)();
              return {
                result: res,
                stateKeys: Array.from(computedDeps) as (keyof S)[],
              };
            });

            useEffect(() => this._subscriber_.subscribe(() => {
              /**
               * Perform dependency collection and processing again to
               * prevent dependency changes caused by conditional logic
               * start
               */
              computedDeps.clear();

              const res = (boundFnValue as AnyFn)();

              const newDeps = Array.from(computedDeps);

              (stateKeys.toString() !== newDeps.toString()) && update(prevState => ({
                ...prevState,
                stateKeys: newDeps,
              }));
              /**
               * Perform dependency collection and processing again to
               * prevent dependency changes caused by conditional logic
               * end
               */

              update(prevState => ({
                ...prevState,
                result: res,
              }));
              // eslint-disable-next-line react-hooks/exhaustive-deps
            }, stateKeys), [stateKeys]);

            return result;
          };
      }

      return this[key as keyof StoreMeta<S>];
    },
  } as ProxyHandler<MacroStore<S>>);
  /** ============================== For core render end ============================== */

  /** ============================== For core helpers start ============================== */
  #createStateMeta = (key: keyof S) => {
    const { _stateMetaMap_ } = this;
    // Resolve the problem that the initialization attribute may be undefined
    if (_stateMetaMap_.has(key)) return _stateMetaMap_;

    _stateMetaMap_.set(key, new StateMeta<S>(key, this));

    return _stateMetaMap_;
  };

  _pushTask_ = (key: keyof S, value: ValueOf<S>, isDelete?: boolean) => {
    const state = this.$state;
    /**
     * @description The pre-execution of the data changes accumulates
     * the logic of the correct execution of the final update,
     * which lays the foundation for subsequent batch updates.
     */
    !isDelete ? (state[key] = value) : delete state[key];

    this._scheduler_.pushTask(
      key,
      value,
      () => {
        // State updates for class components
        this._classUpdater_(key, value);
        /**
         * @description The decision not to execute the updates for class components within the following updater
         * is to preserve the simplicity of the update scheduling for both hook and class components.
         */
        // State updates for hook components
        this.#createStateMeta(key).get(key)!.updater();
      },
    );
  };

  _finallyBatchProcessing_ = () => {
    const listenerStack = this._subscriber_.listenerStack;
    const scheduler = this._scheduler_;
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
          const effectStateTemp = listenerStack.size > 0
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
          if (listenerStack.size > 0) {
            listenerStack.forEach(item => {
              // the clone returned by mapToObject ensures that the externally subscribed data
              // maintains it`s purity and security as much as possible in terms of usage.
              item({
                effectState: effectStateTemp!,
                nextState: this.$state,
                prevState: this._subscriber_.prevBatchState,
              });
            });
          }
        });
      });
    }
  };

  _boundFnProcessing_ = (
    key: keyof S,
    value: AnyBoundFn,
    thisArg: Store<S> | ClassStoreType<S> = this.store,
  ) => {
    const state = this.$state;

    const boundFn = (
      (...args: any[]) => (value as AnyFn).apply(thisArg, args)
    ) as AnyBoundFn;

    boundFn.__bound__ = true;

    state[key] = boundFn as ValueOf<S>;

    return boundFn as ValueOf<S>;
  };

  #getStateMeta = (key: keyof S) => {
    // Perform refresh recovery logic if initialState is a function
    this._restorer_.initialStateRetrieve();
    return this.#createStateMeta(key).get(key)!.useStateMeta();
  };
  /** ============================== For core helpers end ============================== */

  /** ============================== For core utils start ============================== */
  setState = (state: State<S> | StateFnType<S>, callback?: StateCallback<S>) => {
    this._subscriber_.willUpdatingProcessing();

    const _state_ = this.$state;

    let stateTemp = state;

    // processing of prevState
    typeof state === "function" && (stateTemp = (state as StateFnType<S>)(Object.assign({}, _state_)));

    if (stateTemp !== null) {
      stateErrorProcessing({ state: stateTemp, fnName: "setState" });
      // The update of hook is an independent update dispatch action, and traversal processing is needed to unify the stack.
      Object.keys(stateTemp as NonNullable<State<S>>).forEach(key => {
        const value = (stateTemp as S)[key];
        if (!Object.is(value, _state_[key])) {
          this._pushTask_(key, value);
        }
      });
    }

    this._scheduler_.pushCallbackStack(_state_, stateTemp as State<S>, callback);

    this._finallyBatchProcessing_();
  };

  /**
   * @description syncUpdate primarily exists to address issues with normal text input.
   * to meet the needs of normal text input, it synchronizes React's update scheduling.
   */
  syncUpdate = (state: State<S> | StateFnType<S>, callback?: StateCallback<S>) => {
    const _state_ = this.$state;

    let stateTemp = state;

    typeof state === "function" && (stateTemp = (state as StateFnType<S>)(Object.assign({}, _state_)));

    if (stateTemp !== null) {
      stateErrorProcessing({ state: stateTemp, fnName: "syncUpdate" });
      batchUpdate(() => {
        Object.keys(stateTemp as NonNullable<State<S>>).forEach((key: keyof S) => {
          const value = (stateTemp as S)[key];
          if (!Object.is(_state_[key], value)) {
            _state_[key] = value;
            this._classUpdater_(key, value);
            this.#createStateMeta(key).get(key)!.updater();
          }
        });
      });
    }

    this._scheduler_.pushCallbackStack(_state_, stateTemp as State<S>, callback);

    this._finallyBatchProcessing_();
  };

  // Data updates for a single attribute (state-meta)
  #stateMetaUpdate = (
    key: keyof S,
    value: ValueOf<S>,
    isDelete = false,
    target: object | S = this.$state,
    firstLevelKey?: keyof S,
    keyChains?: Set<KeyChainsSourceItemType<S>>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _applyOriginFunction?: ApplyOriginFunctionType,
  ): boolean => {
    // if (this.#freezing) return true;

    const state = this.$state;

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
        ? this.#stateMetaUpdate(
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
        this._subscriber_.willUpdatingProcessing();
        this._pushTask_(key, value, isDelete);
        this._finallyBatchProcessing_();
      }
      return true;
    }
  };

  #createProxy = (
    target: object = this.$state,
    parentTarget: any = this.$state,
    firstLevelKey?: keyof S,
    keyLevel?: number,
    keyChains?: Set<KeyChainsSourceItemType<S>>,
    applyOriginFunction?: ApplyOriginFunctionType,
  ) => {
    const { computedDeps, _options_: { immutable } } = this;
    return new Proxy(target, {
      get: (_: S, key: keyof S) => {

        const sourceFrom$State = !firstLevelKey;

        /**
         * @description `this.$state` is writable, so we need to check here,
         * if the data originates from `$state`,
         * the latest value should be re-fetched from this.$state.
         * If `target[key]` is used directly,
         * it may lead to incorrect changes due to discrepancies
         * between the initially referenced address and the updated reference address
         * of `this.$state` after modifications.
         */
        const value = sourceFrom$State ? this.$state[key] : (target as S)[key];

        sourceFrom$State && computedDeps.add(key);

        const sourceFromThis = hasOwnProperty.call(this, key);

        if (!sourceFromThis && immutable && proxyable(value)) {
          return this.#createProxy(
            value as object,
            target,
            firstLevelKey ?? key,
            (keyLevel ?? 0) + 1,
            (
              keyChains
                // Proxy map and set prototype functions are not added to keyChains.
                ? typeof value === "function"
                  ? new Set(keyChains)
                  : new Set(keyChains).add({ key })
                : new Set().add({ key })
            ) as Set<KeyChainsSourceItemType<S>>,
          );
        }

        /**
         * @description Only bind functions that handle `this.$state`,
         * Processing this-binding for functions nested beyond the second level
         * is practically unnecessary for several reasons:
         * First, such complex and unmaintainable coding patterns are uncommon in practice.
         * Second, even if such multi-level nested functions exist,
         * their this context (for non-arrow functions) should naturally reference
         * their direct host object according to JavaScript's this-binding rules.
         *
         * Most fundamentally, our this-binding processing specifically targets action-type handler functions.
         * By definition, action functions are designed to be used at the first property level,
         * so deeper nested functions are explicitly excluded from this processing.
         */
        if (
          !sourceFromThis
          && typeof value === "function"
          && sourceFrom$State
          && !(value as AnyBoundFn).__bound__
        ) {
          return this._boundFnProcessing_(key, value);
        }

        return !sourceFromThis ? value : this[key as keyof StoreMeta<S>];
      },
      set: (_: S, key: keyof S, value: ValueOf<S>) => this.#stateMetaUpdate(
        key, value, false, target, firstLevelKey,
        new Set(keyChains).add({ key }), applyOriginFunction,
      ),
      // Delete will also play an updating role
      deleteProperty: (_: S, key: keyof S) => this.#stateMetaUpdate(
        key, undefined as ValueOf<S>, true, target, firstLevelKey,
        new Set(keyChains).add({ key }), applyOriginFunction,
      ),
      // The `apply` here is written specifically for prototype chain functions
      // that are applicable to proxyable types such as `Map`, and `Set`.
      apply: (applyOriginFunction: any, thisArg: any, argArray: any[]) => Reflect.apply(
        __MAP_SET_PROTOTYPE_PROXYABLE_TARGET__.get(applyOriginFunction)!(
          applyOriginFunction, thisArg, this.$state, parentTarget as any,
          this.#createProxy, firstLevelKey, keyLevel, keyChains, this.#stateMetaUpdate,
        ),
        thisArg,
        argArray,
      ),
    } as ProxyHandler<S>) as Store<S>;
  };
  /** ============================== For core utils end ============================== */

  /** ============================== For hook components start ============================== */
  /**
   * It is convenient for store.useStore() to call directly
   * 🌟 The reason why it is not changed to store.useStore
   * is due to the consideration of the rules for the use of the hook function.
   */
  useStore = (() => this.$engineStore) as UseMacroStore<S>;
  /** ============================== For hook components end ============================== */

  /** ============================== For class components start ============================== */
  _classUpdater_ = (key: keyof S, value: ValueOf<S>) => {
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
        ? classInstanceItem._$stateRecords_?.has(key)
        && classInstanceItem.setState({ [key]: value } as any)
        : classInstanceStack.delete(classInstanceItem);
    });
  };
  /** ============================== For class components end ============================== */
}
