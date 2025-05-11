import type {
  AnyBoundFn, InitialState, InnerStoreOptions, State, StateCallback, StateFnType,
  StateWithThisType, Store, EngineStoreMetaType, StoreOptions, MacroStore, UseMacroStore,
} from "./types";
import type { AnyFn, Callback, PrimitiveState, ValueOf } from "../types";
import type { ListenerType, Unsubscribe } from "../subscribe/types";
import type { ClassInstanceTypeOfConnectStore } from "../class-connect/types";
import {
  optionsErrorProcessing, setOptionsErrorProcessing, stateErrorProcessing, subscribeErrorProcessing,
} from "./errors";
import { __COMPUTED_PREFIX__, __RESY_BRAND_KEY__ } from "./static";
import { __CLASS_IS_MOUNTED_KEY__, __CLASS_STATE_REF_SET_KEY__ } from "../class-connect/static";
import { hasOwnProperty } from "../utils";
import { __DEV__, batchUpdate } from "../static";
import { effectStateInListenerKeys } from "./helpers";
import { createNewRefValue, proxyable, reduceChanged } from "../immutable/utils";
import { ApplyOriginFunctionType, KeyChainsSourceItemType } from "../immutable/types";
import { __MAP_SET_PROTOTYPE_PROXYABLE_TARGET__ } from "../immutable";
import { useDebugValue, useEffect, useState } from "react";
import { useSubscription as useSubscriptionCore } from "../subscribe";
import Scheduler from "../scheduler";
import StateMeta from "./state";

/**
 * @description The core meta-structure of store
 */
export default class StoreMeta<S extends PrimitiveState> {
  constructor(initialState?: InitialState<S>, options?: StoreOptions) {
    this.#initialState = initialState;
    this.#reducerState = initialState === undefined
      ? ({} as StateWithThisType<S>)
      : typeof initialState === "function"
        ? initialState()
        : initialState;

    optionsErrorProcessing(options);
    this._options_ = {
      unmountRestore: options?.unmountRestore ?? true,
      namespace: options?.namespace ?? undefined,
      immutable: options?.immutable ?? undefined,
      enableMarcoActionStateful: options?.enableMarcoActionStateful ?? undefined,
      __useConciseState__: (options as InnerStoreOptions)?.__useConciseState__ ?? undefined,
      __enableMacros__: (options as InnerStoreOptions)?.__enableMacros__ ?? undefined,
      __functionName__: (options as InnerStoreOptions)?.__functionName__ ?? "createStore",
    };

    const reducerState = this.#reducerState;

    stateErrorProcessing({ state: reducerState, options: this._options_ });

    this.$state = Object.assign({}, reducerState);
    this.#prevBatchState = Object.assign({}, reducerState);

    this.store = this.#createProxy();
  }

  __RESY_BRAND_KEY__ = __RESY_BRAND_KEY__;

  /** ============================== For core constant ready start ============================== */
  readonly #initialState?: InitialState<S>;
  // Retrieve the reducerState
  #reducerState: S;
  readonly _options_;

  readonly #scheduler = new Scheduler<S>();

  // Tag counters for data references of store
  _stateRefCounter_ = 0;

  /**
   * @description Flag indicating that the _initialStateRetrieve_ function is executable.
   * If initialState is a function,
   * you can get the execution flag in the _initialStateRetrieve_ handler of useStore.
   */
  #initialFunctionExecutable: boolean | undefined;

  // After unmount resetting the state (`#restoreProcessing` function has been executed),
  // it is in a frozen state where updates are prohibited.
  // TODO waiting considering, the scenes it contains are a bit complex
  // #freezing: boolean | undefined;

  readonly $state: S;
  // Data status of the previous update batch
  #prevBatchState: S;

  // Subscription listener stack
  readonly #listenerStack = new Set<ListenerType<S>>();
  // Dependency Collection for computed
  computedDeps = new Set<keyof S>();

  // The core meta-structure of engineStore
  readonly _engineStoreMeta_: EngineStoreMetaType<S> = new Map();

  // The storage stack of this instance for the class component
  readonly #classInstanceStack = new Set<ClassInstanceTypeOfConnectStore<S>>();
  /** ============================== For core constant ready end ============================== */

  /** ============================== For core helpers start ============================== */
  /**
   * @description Pre-update processing
   * records the prevState beforehand for later comparison
   * when data changes trigger subscribers.
   */
  #willUpdatingProcessing = () => {
    const scheduler = this.#scheduler;
    if (this.#listenerStack.size > 0 && !scheduler.willUpdating) {
      scheduler.willUpdating = true;
      // Clear first to prevent store from having delete operations that cause prevState to retain deleted data
      this.#prevBatchState = {} as S;
      Object.entries(this.$state).forEach(([key, value]) => {
        this.#prevBatchState[key as keyof S] = value;
      });
    }
  };

  /**
   * Retrieve the reducerState
   * @description If the data is in the initialization state and returned by a function,
   * the initialization function must be executed again.
   * This ensures that the retrieved internal initialization data aligns with the function's logic.
   * For example, if the initialization function's return includes time in milliseconds,
   * it is important to re-execute the function to acquire the most up-to-date initialization data.
   * Such caution ensures the precision of data recovery.
   */
  #retrieveReducerState = () => {
    const initialState = this.#initialState;
    if (typeof initialState === "function") {
      this.#reducerState = {} as S;
      Object.entries(initialState()).forEach(([key, value]) => {
        this.#reducerState[key as keyof S] = value;
      });
    }
  };

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
  #mergeStateKeys = () => {
    const state = this.$state;
    const reducerState = this.#reducerState;
    return Array.from(
      new Set(
        (
          Object.keys(reducerState) as (keyof S)[]
        ).concat(
          Object.keys(state)
        )
      )
    );
  };

  // Logic of recovery processing
  #restoreProcessing = () => {
    this.#retrieveReducerState();

    const state = this.$state;
    const reducerState = this.#reducerState;

    this.#mergeStateKeys().forEach(key => {
      hasOwnProperty.call(reducerState, key)
        ? (state[key] = reducerState[key])
        : delete state[key];
    });

    // this.#freezing = true;
  };

  /** restore utils start */
  // Retrieve recovery processing when initialState is a function
  _initialStateRetrieve_ = () => {
    // unfreeze for normal rendering updates
    // this.#freezing = undefined;

    // The relevant judgment logic is similar to unmountRestore.
    if (this.#initialFunctionExecutable) {
      this.#initialFunctionExecutable = undefined;
      this.#restoreProcessing();
    }
  };

  /**
   * @description In order to prevent the double rendering in React's StrictMode
   * from causing issues with the registration function returned in useEffect,
   * it happens to be opportune for engineStoreMeta to release memory preemptively
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
  _deferRestoreProcessing_ = (callback?: Callback) => {
    const scheduler = this.#scheduler;
    if (!scheduler.deferEffectDestructorExecutable) {
      scheduler.deferEffectDestructorExecutable = Promise.resolve().then(() => {
        scheduler.deferEffectDestructorExecutable = undefined;
        const { _stateRefCounter_ } = this;
        const classInstanceStack = this.#classInstanceStack;
        if (!_stateRefCounter_ && !classInstanceStack.size) {
          /**
           * By using "stateRefCounter" and "classInstanceStack",
           * we determine whether the store still has component references.
           * As long as there is at least one component referencing,
           * the data will not be reset since it is currently in use within the business logic
           * and does not constitute a complete unmount.
           * The complete unmount cycle corresponds to the entire usage cycle of the store.
           */
          const noRefFlag = !classInstanceStack.size && !_stateRefCounter_;
          const initialState = this.#initialState;
          /**
           * When initialState is a function,
           * it does not have to be executed at unmount time,
           * because initialization time is sure to reset execution,
           * thus optimizing code execution efficiency.
           */
          if (this._options_.unmountRestore && noRefFlag && typeof initialState !== "function") {
            this.#restoreProcessing();
          }
          if (typeof initialState === "function" && noRefFlag) {
            this.#initialFunctionExecutable = true;
          }
        }
        callback?.();
      });
    }
  };
  /** restore utils end */

  #hookConnectStore = (key: keyof S) => {
    const { _engineStoreMeta_ } = this;
    // Resolve the problem that the initialization attribute may be undefined
    if (_engineStoreMeta_.has(key)) return _engineStoreMeta_;

    _engineStoreMeta_.set(key, new StateMeta<S>(key, this));

    return _engineStoreMeta_;
  };

  #pushTask = (key: keyof S, value: ValueOf<S>, isDelete?: boolean) => {
    const state = this.$state;
    /**
     * @description The pre-execution of the data changes accumulates
     * the logic of the correct execution of the final update,
     * which lays the foundation for subsequent batch updates.
     */
    !isDelete ? (state[key] = value) : delete state[key];

    this.#scheduler.pushTask(
      key,
      value,
      () => {
        // State updates for class components
        this.#classUpdater(key, value);
        /**
         * @description The decision not to execute the updates for class components within the following updater
         * is to preserve the simplicity of the update scheduling for both hook and class components.
         */
        // State updates for hook components
        this.#hookConnectStore(key).get(key)!.updater();
      },
    );
  };

  #finallyBatchProcessing = () => {
    const listenerStack = this.#listenerStack;
    const scheduler = this.#scheduler;
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
                prevState: this.#prevBatchState,
              });
            });
          }
        });
      });
    }
  };

  #boundFnProcessing = (key: keyof S, value: AnyBoundFn, target: object) => {
    const { store } = this;
    const state = this.$state;
    const isStateSource = target === state;

    const boundFn = ((...args: any[]) => (value as AnyFn).apply(
      // Maintaining the source orientation of the `this` pointer.
      isStateSource ? store : target,
      args,
    )) as AnyBoundFn;

    boundFn.__bound__ = true;

    isStateSource
      ? (state[key] = boundFn as ValueOf<S>)
      : ((target as S)[key] = boundFn as ValueOf<S>);

    return boundFn as ValueOf<S>;
  };

  #connectHook = (key: keyof S) => {
    // Perform refresh recovery logic if initialState is a function
    this._initialStateRetrieve_();
    return this.#hookConnectStore(key).get(key)!.useSyncExternalStore();
  };
  /** ============================== For core helpers end ============================== */

  /** ============================== For core utils start ============================== */
  setState = (state: State<S> | StateFnType<S>, callback?: StateCallback<S>) => {
    const _state_ = this.$state;
    this.#willUpdatingProcessing();

    let stateTemp = state;

    // processing of prevState
    typeof state === "function" && (stateTemp = (state as StateFnType<S>)(Object.assign({}, this.$state)));

    if (stateTemp !== null) {
      stateErrorProcessing({ state: stateTemp, fnName: "setState、syncUpdate" });
      // The update of hook is an independent update dispatch action, and traversal processing is needed to unify the stack.
      Object.keys(stateTemp as NonNullable<State<S>>).forEach(key => {
        const value = (stateTemp as S)[key];
        if (!Object.is(value, _state_[key])) {
          this.#pushTask(key, value);
        }
      });
    }

    this.#scheduler.pushCallbackStack(_state_, stateTemp as State<S>, callback);

    this.#finallyBatchProcessing();
  };

  /**
   * @description syncUpdate primarily exists to address issues with normal text input.
   * to meet the needs of normal text input, it synchronizes React's update scheduling.
   */
  syncUpdate = (state: State<S> | StateFnType<S>, callback?: StateCallback<S>) => {
    let stateTemp = state;

    typeof state === "function" && (stateTemp = (state as StateFnType<S>)(Object.assign({}, this.$state)));

    // Borrowing setState to synchronize the update scheduling mechanism of Resy itself.
    this.setState(stateTemp, callback);

    stateTemp !== null && batchUpdate(() => {
      Object.keys(stateTemp as NonNullable<State<S>>).forEach(key => {
        const value = (stateTemp as Partial<S> | S)[key];
        this.#classUpdater(key, value);
        this.#hookConnectStore(key).get(key)!.updater();
      });
    });
  };

  // Reset recovery initialization state data
  restore = (callback?: StateCallback<S>) => {
    const _state_ = this.$state;
    const reducerState = this.#reducerState;

    this.#willUpdatingProcessing();

    this.#retrieveReducerState();

    const state = {} as State<S>;
    this.#mergeStateKeys().forEach(key => {
      const originValue = reducerState[key];
      if (!Object.is(originValue, _state_[key])) {
        state![key] = originValue;
        this.#pushTask(
          key, originValue, !hasOwnProperty.call(reducerState, key),
        );
      }
    });

    this.#scheduler.pushCallbackStack(_state_, state, callback);

    this.#finallyBatchProcessing();
  };

  // Subscription function
  subscribe = (listener: ListenerType<S>, stateKeys?: (keyof S)[]): Unsubscribe => {
    const listenerStack = this.#listenerStack;

    subscribeErrorProcessing(listener, stateKeys);

    const listenerWrap: ListenerType<S> = data => {
      effectStateInListenerKeys(data.effectState, stateKeys) && listener(data);
    };

    listenerStack.add(listenerWrap);

    // Returns the unsubscribing function, which allows the user to choose whether or not to unsubscribe,
    // because it is also possible that the user wants the subscription to remain in effect.
    return () => listenerStack.delete(listenerWrap as ListenerType<S>);
  };
  /** ============================== For core utils end ============================== */

  /** ============================== For core render start ============================== */
  // Data updates for a single attribute
  #singleUpdate = (
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

    if (target !== state) {
      // During each update, the target here is the latest target object obtained by the previous agent,
      // so the PrevValue here is also the latest data before the update.
      const prevValue = (target as S)[key];

      // Directly compare the PrevValue with the current value to be updated
      // to see if the data needs to be updated and processed.
      const changed = !Object.is(prevValue, value);

      const firstLevelValue = state[firstLevelKey!];

      changed && reduceChanged(value, keyChains!, firstLevelValue);

      return changed
        ? this.#singleUpdate(
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
        this.#willUpdatingProcessing();
        this.#pushTask(key, value, isDelete);
        this.#finallyBatchProcessing();
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
    const {
      computedDeps,
      _options_: { immutable },
    } = this;
    const state = this.$state;
    return new Proxy(target, {
      get: (_: S, key: keyof S) => {
        const isStateSource = target === state;

        const value = isStateSource
          ? state[key]
          : (target as S)[key];

        isStateSource && computedDeps.add(key);

        const isCoreProp = hasOwnProperty.call(this, key);

        if (!isCoreProp && immutable && proxyable(value)) {
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
         * @description The array prototype methods will automatically handle proxy operations,
         * because accessing each element of an array is done through its index,
         * which will be intercepted by the proxy.
         * Therefore, for array prototype methods, we don't need any special treatment.
         */
        if (
          !isCoreProp
          && typeof value === "function"
          && !hasOwnProperty.call(Array.prototype, (value as AnyFn).name)
          && !(value as AnyBoundFn).__bound__
        ) {
          return this.#boundFnProcessing(key, value, target);
        }

        return !isCoreProp ? value : this[key as keyof StoreMeta<S>];
      },
      set: (_: S, key: keyof S, value: ValueOf<S>) => this.#singleUpdate(
        key, value, false, target, firstLevelKey,
        new Set(keyChains).add({ key }), applyOriginFunction,
      ),
      // Delete will also play an updating role
      deleteProperty: (_: S, key: keyof S) => this.#singleUpdate(
        key, undefined as ValueOf<S>, true, target, firstLevelKey,
        new Set(keyChains).add({ key }), applyOriginFunction,
      ),
      // The `apply` here is written specifically for prototype chain functions
      // that are applicable to proxyable types such as `Map`, and `Set`.
      apply: (applyOriginFunction: any, thisArg: any, argArray: any[]) => Reflect.apply(
        __MAP_SET_PROTOTYPE_PROXYABLE_TARGET__.get(applyOriginFunction)!(
          applyOriginFunction, thisArg, state, parentTarget as any,
          this.#createProxy, firstLevelKey, keyLevel, keyChains, this.#singleUpdate,
        ),
        thisArg,
        argArray,
      ),
    } as ProxyHandler<S>) as Store<S>;
  };

  // A proxy object with the capabilities of updating and data tracking.
  store: Store<S>;

  // Proxy of driver update re-render for useStore
  engineStore = new Proxy({} as MacroStore<S>, {
    get: (_: S, key: keyof S) => {
      const {
        _options_: {
          namespace,
          __enableMacros__,
          enableMarcoActionStateful,
        },
      } = this;
      const state = this.$state;

      // Get the latest value
      const value = state[key];

      const isCoreProp = hasOwnProperty.call(this, key);

      if (!isCoreProp && typeof value !== "function") {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        __DEV__ && useDebugValue({
          key,
          value,
          ...(
            namespace
              ? { namespace }
              : null
          ),
        });

        return this.#connectHook(key);
      }

      if (!isCoreProp && typeof value === "function") {
        // Avoid memory redundancy waste caused by repeated bindings and maintain the function reference address unchanged.
        !(value as AnyBoundFn).__bound__ && this.#boundFnProcessing(key, value, state);

        const fnStateful = !__enableMacros__ || enableMarcoActionStateful;

        const boundFnValue = state[key];

        // eslint-disable-next-line react-hooks/rules-of-hooks
        fnStateful && __DEV__ && useDebugValue({
          key,
          value: boundFnValue,
          ...(
            namespace
              ? { namespace }
              : null
          ),
        });

        /**
         * @description Enable function properties to have the ability to update rendering.
         * Placing both the __bound__ and the state's set operation before the #connectHook
         * can preemptively avoid the tearing synchronization handling inside useSyncExternalStore,
         * resulting in twice the redundant rendering execution.
         */
        fnStateful && this.#connectHook(key);

        return !key.toString().startsWith(__COMPUTED_PREFIX__)
          ? boundFnValue
          // TODO waiting upgrade optimize (暂时应该没有属性依赖记录收集销毁的逻辑问题)
          : () => {
            const { computedDeps, subscribe } = this;

            const [{ result, stateKeys }, update] = useState(() => {
              // Clear the previous dirty dependencies before collecting them
              computedDeps.clear();
              const res = (boundFnValue as AnyFn)();
              return {
                result: res,
                stateKeys: Array.from(computedDeps) as (keyof S)[],
              };
            });

            useEffect(() => subscribe(() => {
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

  /** ============================== For operate options start ============================== */
  // Change options configuration
  setOptions = (options: { unmountRestore: boolean }) => {
    setOptionsErrorProcessing(options);
    this._options_.unmountRestore = options.unmountRestore;
  };

  getOptions = () => Object.assign({}, this._options_);
  /** ============================== For operate options end ============================== */

  /** ============================== For hook components start ============================== */
  /**
   * It is convenient for store.useStore() to call directly
   * 🌟 The reason why it is not changed to store.useStore
   * is due to the consideration of the rules for the use of the hook function.
   */
  useStore = (() => this.engineStore) as UseMacroStore<S>;

  useSubscription = (listener: ListenerType<S>, stateKeys?: (keyof S)[]) => {
    const { store, _options_: { namespace } } = this;
    if (__DEV__) {
      const store_namespace = namespace
        ? { namespace }
        : null;
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useDebugValue({
        listener,
        stateKeys,
        ...store_namespace,
      });
    }
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useSubscriptionCore(store!, listener, stateKeys);
  };
  /** ============================== For hook components end ============================== */

  /** ============================== For class components use start ============================== */
  #classUpdater = (key: keyof S, value: ValueOf<S>) => {
    const classInstanceStack = this.#classInstanceStack;
    classInstanceStack.forEach(classThisPointerItem => {
      /**
       * There is an "updater" attribute on the internal this pointer of react's class,
       * and an "isMounted" method is mounted on it to determine whether the component has been loaded.
       * If it is in "React.StrictMode" mode,
       * React will discard the first generated instance and the instance will not be mounted.
       */
      classThisPointerItem[__CLASS_IS_MOUNTED_KEY__]
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
        ? classThisPointerItem[__CLASS_STATE_REF_SET_KEY__]?.has(key) && (
          classThisPointerItem.setState({ [key]: value } as State<S>)
        )
        : classInstanceStack.delete(classThisPointerItem);
    });
  };

  #connectClass = (thisArg: ClassInstanceTypeOfConnectStore<S>, key: keyof S) => {
    // In class, Set is used for reference tags and combined with the size attribute of Set to judge.
    thisArg[__CLASS_STATE_REF_SET_KEY__].add(key);
    return this.$state[key];
  };

  // Connecting this pointer of the class component
  _classConnectStore_ = (thisArg: ClassInstanceTypeOfConnectStore<S>) => {
    this.#classInstanceStack.add(thisArg);

    // Data agents for use by class components
    const classEngineStore = new Proxy({} as S, {
      get: (_: S, key: keyof S) => {
        // Compatible with scenarios where both hook components and class components are used together.
        if (key === "useStore") return () => classEngineStore;

        const isCoreProp = hasOwnProperty.call(this, key);

        const value = this.$state[key];

        return !isCoreProp
          ? (
            typeof value !== "function"
              ? this.#connectClass(thisArg, key)
              // Invoke a function data hook to grant the ability to update and render function data.
              : (...args: any[]) => (
                this.#connectClass(thisArg, key) as AnyFn
              ).apply(classEngineStore, args)
          )
          : this[key as keyof StoreMeta<S>];
      },
    } as ProxyHandler<S>);

    return classEngineStore;
  };

  // Unmount execution of class components
  _classUnmountProcessing_ = (thisArg: ClassInstanceTypeOfConnectStore<S>) => {
    this.#classInstanceStack.delete(thisArg);
    this._deferRestoreProcessing_();
  };
  /** ============================== For class components use end ============================== */
}
