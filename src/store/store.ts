import type {
  AnyBoundFn, CorePropsType, ExternalMapType, ExternalMapValue, InitialState,
  InnerStoreOptions, State, StateCallback, StateFnType, StateRefCounterMapType,
  StateWithThisType, Store, StoreMap, InitialFnCanExecMapType,
} from "./types";
import type { AnyFn, Callback, MapType, PrimitiveState, ValueOf } from "../types";
import type { ListenerParams, ListenerType, Unsubscribe } from "../subscribe/types";
import type { ClassInstanceTypeOfConnectStore } from "../class-connect/types";
import Scheduler from "../scheduler";
import {
  optionsErrorProcessing, setOptionsErrorProcessing, stateErrorProcessing, subscribeErrorProcessing,
} from "./errors";
import { mapToObject, objectToMap, shallowCloneMap, clearObject } from "./utils";
import {
  __GETTERS_PREFIX__, __REGENERATIVE_SYSTEM_KEY__, __STORE_NAMESPACE__, __USE_STORE_KEY__,
} from "./static";
import {
  __CLASS_IS_MOUNTED_KEY__, __CLASS_STATE_REF_SET_KEY__, __CLASS_CONNECT_STORE_KEY__,
  __CLASS_UNMOUNT_PROCESSING_KEY__, __CLASS_INITIAL_STATE_RETRIEVE_KEY__,
} from "../class-connect/static";
import { hasOwnProperty } from "../utils";
import { __DEV__, batchUpdate } from "../static";
import { effectStateInListenerKeys } from "./helpers";
import { createNewRefValue, proxyable, reduceChanged } from "../immutable/utils";
import { ApplyOriginFunctionType, KeyChainsSourceItemType } from "../immutable/types";
import { __MAP_SET_PROTOTYPE_PROXYABLE_TARGET__ } from "../immutable";
import { useDebugValue, useEffect, useState } from "react";
import { useSubscription as useSubscriptionCore } from "../subscribe";
import StateMeta from "./state";

/**
 * @description core
 */
export default class StoreCore<S extends PrimitiveState> {
  constructor(props: CorePropsType<S>) {
    const { initialState, options } = props;

    this.initialState = initialState;
    this.reducerState = initialState === undefined
      ? ({} as StateWithThisType<S>)
      : typeof initialState === "function"
        ? initialState()
        : initialState;

    optionsErrorProcessing(options);
    this.options = {
      unmountRestore: options?.unmountRestore ?? true,
      namespace: options?.namespace ?? undefined,
      immutable: options?.immutable ?? undefined,
      enableMarcoActionStateful: options?.enableMarcoActionStateful ?? undefined,
      __useConciseState__: (options as InnerStoreOptions)?.__useConciseState__ ?? undefined,
      __enableMacros__: (options as InnerStoreOptions)?.__enableMacros__ ?? undefined,
      __functionName__: (options as InnerStoreOptions)?.__functionName__ ?? "createStore",
    };

    // for development tools
    this.externalMap.set(__STORE_NAMESPACE__, this.options.namespace);

    stateErrorProcessing({ state: this.reducerState, options: this.options });

    this.stateMap = objectToMap(this.reducerState);
    this.prevBatchState = objectToMap(this.reducerState);

    this.store = this.createProxy();
    // Enable useConciseState and defineStore to have data tracking capabilities through the store
    if (this.options.__useConciseState__ || this.options.__enableMacros__) {
      this.externalMap.set("store", this.store);
    }
  }

  /** ============================== For core constant ready start ============================== */
  initialState?: InitialState<S>;
  // Retrieve the reducerState
  reducerState: S;
  options;

  scheduler = new Scheduler<S>();

  // Tag counters for data references of store
  storeStateRefCounterMap: StateRefCounterMapType = new Map().set("counter", 0);

  // Flag indicating that the initialStateRetrieve function is executable
  initialFnCanExecMap: InitialFnCanExecMapType = new Map();

  /**
   * @description Use Map and Set to improve performance,
   * "Simultaneously, it can keep the `initialState` unchanged."
   */
  stateMap: MapType<S>;
  // Data status of the previous update batch
  prevBatchState: MapType<S>;

  // Subscription listener stack
  listenerSet = new Set<ListenerType<S>>();
  // Dependency Collection for getters or computed
  computedStateDepsSet = new Set<keyof S>();

  // The core map of store
  storeMap: StoreMap<S> = new Map();

  // The storage stack of this proxy object for the class component
  classThisPointerSet = new Set<ClassInstanceTypeOfConnectStore<S>>();
  /** ============================== For core constant ready end ============================== */

  /** ============================== For core helpers start ============================== */
  /**
   * @description Pre-update processing
   * records the prevBatchState beforehand for later comparison
   * when data changes trigger subscribers.
   */
  willUpdatingProcessing = () => {
    if (this.listenerSet.size > 0 && !this.scheduler.willUpdating) {
      this.scheduler.willUpdating = true;
      // Clear first to prevent store from having delete operations that cause prevBatchState to retain deleted data
      this.prevBatchState.clear();
      this.stateMap.forEach((value, key) => {
        this.prevBatchState.set(key, value);
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
  retrieveReducerState = () => {
    const { initialState, reducerState } = this;
    if (typeof initialState === "function") {
      clearObject(reducerState);
      Object.entries(initialState()).forEach(([key, value]) => {
        reducerState[key as keyof S] = value;
      });
    }
  };

  /**
   * @description Get all the properties
   * Here we merge the data attributes of the current "stateMap" and the initial "reducerState"
   * in order to count all the new or deleted attributes.
   * It is convenient to use the hasOwnProperty method
   * to check whether the 'reducerState' has a specific data attribute before restoring the data.。
   * Thinking backwards,
   * if we don't aggregate all the keys,
   * then we can only perform the traversal of keys based on either 'reducerState' or 'stateMap',
   * and restore them based on whether they have properties confirmed by the hasOwnProperty method.
   * If we choose reducerState, we will not be able to control the newly added key,
   * and if we choose stateMap, we will not be able to delete the key.
   * Neither of them is perfect, so we must merge both sets of results.
   */
  mergeStateKeys = () => {
    const { reducerState, stateMap } = this;
    return Array.from(
      new Set(
        (
          Object.keys(reducerState) as (keyof S)[]
        ).concat(
          stateMap.keys().toArray()
        )
      )
    );
  };

  // Logic of recovery processing
  restoreProcessing = () => {
    this.retrieveReducerState();

    const { reducerState, stateMap } = this;

    this.mergeStateKeys().forEach(key => {
      hasOwnProperty.call(reducerState, key)
        ? stateMap.set(key, reducerState[key])
        : stateMap.delete(key);
    });
  };

  /** restore utils start */
  /**
   * By using "storeStateRefCounterMap" and "classThisPointerSet",
   * we determine whether the store still has component references.
   * As long as there is at least one component referencing,
   * the data will not be reset since it is currently in use within the business logic and does not constitute a complete unmount.
   * The complete unmount cycle corresponds to the entire usage cycle of the store.
   */
  unmountRestore = () => {
    const {
      classThisPointerSet, storeStateRefCounterMap,
      options, initialState,
      initialFnCanExecMap,
    } = this;
    const noRefFlag = !classThisPointerSet.size
      && !storeStateRefCounterMap.get("counter");
    /**
     * When initialState is a function,
     * it does not have to be executed at unmount time,
     * because initialization time is sure to reset execution,
     * thus optimizing code execution efficiency.
     */
    if (options.unmountRestore && noRefFlag && typeof initialState !== "function") {
      this.restoreProcessing();
    }
    if (typeof initialState === "function" && noRefFlag) {
      initialFnCanExecMap.set("canExec", true);
    }
  };

  initialStateRetrieve = () => {
    const { initialFnCanExecMap } = this;
    // The relevant judgment logic is similar to unmountRestore.
    if (initialFnCanExecMap.get("canExec")) {
      initialFnCanExecMap.set("canExec", null);
      this.restoreProcessing();
    }
  };

  /**
   * @description In order to prevent the double rendering in React's StrictMode
   * from causing issues with the registration function returned in useEffect,
   * it happens to be opportune for storeMap to release memory preemptively
   * during the first unmount execution.
   * (with memory release being performed in the callback).
   * This early release of memory removes the previous storeMapValue,
   * and any subsequent updates or renderings will regenerate a new storeMapValue.
   * However, this process leads to the updater function's singlePropStoreChangeSet
   * within storeMapValue referencing the address of the previously outdated storeMapValue.
   * Meanwhile, that old singlePropStoreChangeSet has already been deleted.
   * and cleared with the early release of the storeMapValue's memory,
   * leading to the updater function's incapability to make valid updates.
   * Here, to ensure operations such as unmount, freeing memory,
   * and unmountRestore run smoothly,
   * a microtask can be used to postpone the unmount process.
   */
  deferRestoreProcessing = (callback?: Callback) => {
    const {
      scheduler, storeStateRefCounterMap, classThisPointerSet,
    } = this;
    if (!scheduler.deferEffectDestructorExecFlag) {
      scheduler.deferEffectDestructorExecFlag = Promise.resolve().then(() => {
        scheduler.deferEffectDestructorExecFlag = undefined;
        if (!storeStateRefCounterMap.get("counter") && !classThisPointerSet.size) {
          this.unmountRestore();
        }
        callback?.();
      });
    }
  };
  /** restore utils end */

  classUpdater = (key: keyof S, value: ValueOf<S>) => {
    const { classThisPointerSet } = this;
    classThisPointerSet?.forEach(classThisPointerItem => {
      /**
       * There is an "updater" attribute on the internal this pointer of react's class,
       * and an "isMounted" method is mounted on it to determine whether the component has been loaded.
       * If it is in "React.StrictMode" mode,
       * React will discard the first generated instance and the instance will not be mounted.
       */
      if (classThisPointerItem[__CLASS_IS_MOUNTED_KEY__]) {
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
        classThisPointerItem[__CLASS_STATE_REF_SET_KEY__]?.has(key) && (
          classThisPointerItem.setState({ [key]: value } as State<S>)
        );
      } else {
        classThisPointerSet.delete(classThisPointerItem);
      }
    });
  };

  hookConnectStore = (key: keyof S) => {
    const { storeMap } = this;
    // Resolve the problem that the initialization attribute may be undefined
    if (storeMap.has(key)) return storeMap;

    const storeMapValue = new StateMeta<S>({ key, thisArgStore: this });

    storeMap.set(key, storeMapValue);

    return storeMap;
  };

  pushTask = (key: keyof S, value: ValueOf<S>, isDelete?: boolean) => {
    const { stateMap, scheduler } = this;
    /**
     * @description The pre-execution of the data changes accumulates
     * the logic of the correct execution of the final update,
     * which lays the foundation for subsequent batch updates.
     */
    !isDelete ? stateMap.set(key, value) : stateMap.delete(key);

    scheduler.pushTask(
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
        this.hookConnectStore(key).get(key)!.updater();
      },
    );
  };

  finallyBatchProcessing = () => {
    const {
      scheduler, listenerSet,
      stateMap, prevBatchState,
    } = this;
    const {
      taskDataMap, taskQueueMap, callbackStackSet,
    } = scheduler;

    if ((taskDataMap.size > 0 || callbackStackSet.size > 0) && !scheduler.isUpdating) {
      // Reduce the generation of redundant microtasks through the isUpdating flag
      scheduler.isUpdating = Promise.resolve().then(() => {
        /**
         * @description Reset the isUpdating and willUpdating flags
         * to ensure that each subsequent round of update batching can proceed and operate normally.
         */
        scheduler.isUpdating = undefined;
        scheduler.willUpdating = undefined;

        batchUpdate(() => {
          if (taskDataMap.size > 0) {
            // Perform update task
            taskQueueMap.forEach(task => {
              task();
            });
          }

          // Make a shallow clone of the "taskDataMap" data for the "effectState" of "subscribe",
          // Perform a shallowClone before executing flushTask, otherwise, it might become impossible to retrieve `taskDataMap`.
          const effectStateTemp = listenerSet.size > 0 ? shallowCloneMap(taskDataMap) : undefined;

          /**
           * @description So far, the task of this round of data updates is complete.
           * The task data and task queue are immediately flushed and cleared,
           * freeing up space in preparation for the next round of data updates.
           */
          scheduler.flushTask();

          // 🌟 The execution of subscribe and callback needs to be placed after flush,
          // otherwise their own update queues will be emptied in advance, affecting their own internal execution.

          // Trigger the execution of the callback function
          if (callbackStackSet.size > 0) {
            callbackStackSet.forEach(({ callback, nextState }) => {
              callback(nextState);
            });
            callbackStackSet.clear();
          }

          // 🌟 As logically, the listener in subscribe needs to be executed after the callback has been executed.

          // Trigger the execution of subscription snooping
          if (listenerSet.size > 0) {
            // Reduce the burden of executing `mapToObject` on three data sets through proxy.
            const listenerDataProxy = new Proxy({} as ListenerParams<S>, {
              get(_: ListenerParams<S>, listenerDataKey: keyof ListenerParams<S>): any {
                if (listenerDataKey === "effectState") {
                  return mapToObject(effectStateTemp!);
                }
                if (listenerDataKey === "nextState") {
                  return mapToObject(stateMap!);
                }
                if (listenerDataKey === "prevState") {
                  return mapToObject(prevBatchState!);
                }
              }
            } as ProxyHandler<ListenerParams<S>>);

            listenerSet.forEach(item => {
              // the clone returned by mapToObject ensures that the externally subscribed data
              // maintains it`s purity and security as much as possible in terms of usage.
              item(listenerDataProxy);
            });
          }
        });
      });
    }
  };

  boundFnProcessing = (key: keyof S, value: AnyBoundFn, target: object) => {
    const { stateMap, store } = this;
    const isStateSource = target === stateMap;
    const boundFn = ((...args: any[]) => (value as AnyFn).apply(
      // Maintaining the source orientation of the `this` pointer.
      isStateSource ? store : target,
      args,
    )) as AnyBoundFn;
    boundFn.__bound__ = true;
    if (isStateSource) {
      stateMap.set(key, boundFn as ValueOf<S>);
    } else {
      (target as S)[key] = boundFn as ValueOf<S>;
    }
    return boundFn as ValueOf<S>;
  };

  connectHook = (key: keyof S) => {
    // Perform refresh recovery logic if initialState is a function
    this.initialStateRetrieve();
    return this.hookConnectStore(key).get(key)!.useSyncExternalStore();
  };
  /** ============================== For core helpers end ============================== */

  /** ============================== For core utils start ============================== */
  setState = (state: State<S> | StateFnType<S>, callback?: StateCallback<S>) => {
    const { stateMap, scheduler } = this;
    this.willUpdatingProcessing();

    let stateTemp = state;

    if (typeof state === "function") {
      // processing of prevState
      stateTemp = (state as StateFnType<S>)(mapToObject(stateMap));
    }

    if (stateTemp !== null) {
      stateErrorProcessing({ state: stateTemp, fnName: "setState、syncUpdate" });
      // The update of hook is an independent update dispatch action, and traversal processing is needed to unify the stack.
      Object.keys(stateTemp as NonNullable<State<S>>).forEach(key => {
        const value = (stateTemp as S)[key];
        if (!Object.is(value, this.stateMap.get(key))) {
          this.pushTask(key, value);
        }
      });
    }

    scheduler.pushCallbackStack(stateMap, stateTemp as State<S>, callback);

    this.finallyBatchProcessing();
  };

  /**
   * @description syncUpdate primarily exists to address issues with normal text input.
   * to meet the needs of normal text input, it synchronizes React's update scheduling.
   */
  syncUpdate = (state: State<S> | StateFnType<S>, callback?: StateCallback<S>) => {
    let stateTemp = state;

    if (typeof state === "function") {
      stateTemp = (state as StateFnType<S>)(mapToObject(this.stateMap));
    }
    // Borrowing setState to synchronize the update scheduling mechanism of Resy itself.
    this.setState(stateTemp, callback);

    if (stateTemp !== null) {
      batchUpdate(() => {
        Object.keys(stateTemp as NonNullable<State<S>>).forEach(key => {
          const value = (stateTemp as Partial<S> | S)[key];
          this.classUpdater(key, value);
          this.hookConnectStore(key).get(key)!.updater();
        });
      });
    }
  };

  // Reset recovery initialization state data
  restore = (callback?: StateCallback<S>) => {
    const { reducerState, stateMap, scheduler } = this;

    this.willUpdatingProcessing();

    this.retrieveReducerState();

    const state = {} as State<S>;
    this.mergeStateKeys().forEach(key => {
      const originValue = reducerState[key];
      if (!Object.is(originValue, stateMap.get(key))) {
        state![key] = originValue;
        this.pushTask(
          key, originValue, !hasOwnProperty.call(reducerState, key),
        );
      }
    });

    scheduler.pushCallbackStack(stateMap, state, callback);

    this.finallyBatchProcessing();
  };

  // Subscription function
  subscribe = (listener: ListenerType<S>, stateKeys?: (keyof S)[]): Unsubscribe => {
    const { listenerSet } = this;

    subscribeErrorProcessing(listener, stateKeys);
    const listenerWrap: ListenerType<S> = data => {
      if (effectStateInListenerKeys(data.effectState, stateKeys)) listener(data);
    };

    listenerSet.add(listenerWrap);

    // Returns the unsubscribing function, which allows the user to choose whether or not to unsubscribe,
    // because it is also possible that the user wants the subscription to remain in effect.
    return () => listenerSet.delete(listenerWrap as ListenerType<S>);
  };
  /** ============================== For core utils end ============================== */

  /** ============================== For core render start ============================== */
  // Data updates for a single attribute
  singleUpdate = (
    key: keyof S,
    value: ValueOf<S>,
    isDelete = false,
    target: object | S = this.stateMap,
    firstLevelKey?: keyof S,
    keyChains?: Set<KeyChainsSourceItemType<S>>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _applyOriginFunction?: ApplyOriginFunctionType,
  ): boolean => {
    const { stateMap } = this;
    if (target !== stateMap) {
      // During each update, the target here is the latest target object obtained by the previous agent,
      // so the PrevValue here is also the latest data before the update.
      const prevValue = (target as S)[key];

      // Directly compare the PrevValue with the current value to be updated
      // to see if the data needs to be updated and processed.
      const changed = !Object.is(prevValue, value);

      const firstLevelValue = stateMap.get(firstLevelKey!);

      if (changed) reduceChanged(value, keyChains!, firstLevelValue);

      return changed
        ? this.singleUpdate(
          firstLevelKey!,
          /**
           * @description When performing updates on the first-level attributes here,
           * a reference update is required. Without a reference update,
           * the incremental processing of `noneFirstLevelKeyChains` and `firstLevelValue` in the preceding `reduce` function
           * will result in no actual change to the references.
           * Consequently, when reaching the "else" branch
           * and executing the logic of `if (!Object.is(value, stateMap.get(key)))`,
           * it will show that the previous and current values are equal,
           * ultimately leading to the update being skipped.
           */
          createNewRefValue(firstLevelValue) as ValueOf<S>,
          isDelete,
          stateMap,
        )
        : true;
    } else {
      if (!Object.is(value, stateMap.get(key))) {
        this.willUpdatingProcessing();
        this.pushTask(key, value, isDelete);
        this.finallyBatchProcessing();
      }
      return true;
    }
  };

  createProxy = (
    target: object = this.stateMap,
    parentTarget: any = this.stateMap,
    firstLevelKey?: keyof S,
    keyLevel?: number,
    keyChains?: Set<KeyChainsSourceItemType<S>>,
    applyOriginFunction?: ApplyOriginFunctionType,
  ) => {
    const {
      stateMap, computedStateDepsSet, externalMap,
      options,
    } = this;
    return new Proxy(target, {
      get: (_: S, key: keyof S) => {
        const isStateSource = target === stateMap;

        const value = isStateSource
          ? stateMap.get(key)
          : (target as S)[key];

        isStateSource && computedStateDepsSet.add(key);

        const externalValue = externalMap.get(key as keyof ExternalMapValue<S>);

        if (!externalValue && options.immutable && proxyable(value)) {
          return this.createProxy(
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
          !externalValue
          && typeof value === "function"
          && !hasOwnProperty.call(Array.prototype, (value as AnyFn).name)
          && !(value as AnyBoundFn).__bound__
        ) {
          return this.boundFnProcessing(key, value, target);
        }

        return !externalValue ? value : externalValue;
      },
      set: (_: S, key: keyof S, value: ValueOf<S>) => this.singleUpdate(
        key, value, false, target, firstLevelKey,
        new Set(keyChains).add({ key }), applyOriginFunction,
      ),
      // Delete will also play an updating role
      deleteProperty: (_: S, key: keyof S) => this.singleUpdate(
        key, undefined as ValueOf<S>, true, target, firstLevelKey,
        new Set(keyChains).add({ key }), applyOriginFunction,
      ),
      // The `apply` here is written specifically for prototype chain functions
      // that are applicable to proxyable types such as `Map`, and `Set`.
      apply: (applyOriginFunction: any, thisArg: any, argArray: any[]) => Reflect.apply(
        __MAP_SET_PROTOTYPE_PROXYABLE_TARGET__.get(applyOriginFunction)!(
          applyOriginFunction, thisArg, stateMap, parentTarget as any,
          this.createProxy, firstLevelKey, keyLevel, keyChains, this.singleUpdate,
        ),
        thisArg,
        argArray,
      ),
    } as ProxyHandler<S>) as Store<S>;
  };

  // A proxy object with the capabilities of updating and data tracking.
  store: Store<S>;

  // Proxy of driver update re-render for useStore
  engineStore = new Proxy({} as S, {
    get: (_: StoreMap<S>, key: keyof S) => {
      const {
        stateMap, externalMap, options,
      } = this;
      // Get the latest value
      const value = stateMap.get(key);

      const externalValue = externalMap.get(key as keyof ExternalMapValue<S>);

      if (!externalValue && typeof value !== "function") {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        __DEV__ && useDebugValue({
          key,
          value,
          ...(
            options.namespace
              ? { namespace: options.namespace }
              : null
          ),
        });

        return this.connectHook(key);
      }

      if (!externalValue && typeof value === "function") {
        // Avoid memory redundancy waste caused by repeated bindings and maintain the function reference address unchanged.
        !(value as AnyBoundFn).__bound__ && this.boundFnProcessing(key, value, stateMap);

        const fnStateful = !options.__enableMacros__ || options.enableMarcoActionStateful;

        const boundFnValue = stateMap.get(key);

        // eslint-disable-next-line react-hooks/rules-of-hooks
        fnStateful && __DEV__ && useDebugValue({
          key,
          value: boundFnValue,
          ...(
            options.namespace
              ? { namespace: options.namespace }
              : null
          ),
        });

        /**
         * @description Enable function properties to have the ability to update rendering.
         * Placing both the __bound__ and the stateMap's set operation before the connectHook
         * can preemptively avoid the tearing synchronization handling inside useSyncExternalStore,
         * resulting in twice the redundant rendering execution.
         */
        fnStateful && this.connectHook(key);

        return !key.toString().startsWith(__GETTERS_PREFIX__)
          ? boundFnValue
          // TODO waiting upgrade optimize (暂时应该没有属性依赖记录收集销毁的逻辑问题)
          : () => {
            const { computedStateDepsSet, subscribe } = this;

            const [{ result, stateKeys }, update] = useState(() => {
              // Clear the previous dirty dependencies before collecting them
              computedStateDepsSet.clear();
              const res = (boundFnValue as AnyFn)();
              return {
                result: res,
                stateKeys: Array.from(computedStateDepsSet) as (keyof S)[],
              };
            });

            useEffect(() => subscribe(() => {
              /**
               * Perform dependency collection and processing again to
               * prevent dependency changes caused by conditional logic
               * start
               */
              computedStateDepsSet.clear();

              const res = (boundFnValue as AnyFn)();

              const newDeps = Array.from(computedStateDepsSet);

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

      return externalValue;
    },
  } as ProxyHandler<any>);
  /** ============================== For core render end ============================== */

  /** ============================== For operate options start ============================== */
  // Change options configuration
  setOptions = (options: { unmountRestore: boolean }) => {
    setOptionsErrorProcessing(options);
    this.options.unmountRestore = options.unmountRestore;
  };

  getOptions = () => {
    return Object.assign({}, this.options);
  };
  /** ============================== For operate options end ============================== */

  /** ============================== For hook components start ============================== */
  /**
   * It is convenient for store.useStore() to call directly
   * 🌟 The reason why it is not changed to store.useStore
   * is due to the consideration of the rules for the use of the hook function.
   */
  useStore = () => {
    return this.engineStore;
  };

  useSubscription = (listener: ListenerType<S>, stateKeys?: (keyof S)[]) => {
    const { options, store } = this;
    if (__DEV__) {
      const store_namespace = options.namespace
        ? { namespace: options.namespace }
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
  connectClass = (thisArg: ClassInstanceTypeOfConnectStore<S>, key: keyof S) => {
    // In class, Set is used for reference tags and combined with the size attribute of Set to judge.
    thisArg[__CLASS_STATE_REF_SET_KEY__].add(key);
    return this.stateMap.get(key);
  };

  // Connecting this pointer of the class component (therefore, this cannot be an arrow function)
  classConnectStore = (thisArg: ClassInstanceTypeOfConnectStore<S>) => {
    this.classThisPointerSet.add(thisArg);
    // Data agents for use by class components
    const classEngineStore = new Proxy({} as S, {
      get: (_: StoreMap<S>, key: keyof S) => {
        // Compatible with scenarios where both hook components and class components are used together.
        if (key === "useStore") return () => classEngineStore;
        const { stateMap, externalMap } = this;

        const value = stateMap.get(key);

        return externalMap.get(key as keyof ExternalMapValue<S>) || (
          typeof value !== "function"
            ? this.connectClass(thisArg, key)
            // Invoke a function data hook to grant the ability to update and render function data.
            : (...args: any[]) => (
              this.connectClass(thisArg, key) as AnyFn
            ).apply(classEngineStore, args)
        );
      },
    } as ProxyHandler<any>);
    return classEngineStore;
  };

  // Unmount execution of class components
  classUnmountProcessing = (thisArg: ClassInstanceTypeOfConnectStore<S>) => {
    this.classThisPointerSet.delete(thisArg);
    this.deferRestoreProcessing();
  };
  /** ============================== For class components use end ============================== */

  /**
   * @description Map for additional related internal objects of store
   * For example, some related functions or identifiers,
   * such as setState, subscribe and internal identity __REGENERATIVE_SYSTEM_KEY__
   */
  externalMap: ExternalMapType<S> = new Map([
    ["setState", this.setState],
    ["syncUpdate", this.syncUpdate],
    ["restore", this.restore],
    ["subscribe", this.subscribe],

    [__USE_STORE_KEY__, this.engineStore],
    [__REGENERATIVE_SYSTEM_KEY__, __REGENERATIVE_SYSTEM_KEY__],

    ["setOptions", this.setOptions],
    ["getOptions", this.getOptions],
    ["useStore", this.useStore],
    ["useSubscription", this.useSubscription],

    /**
     * @description The reason why the three operation functions for class components
     * — connect, classUnmountProcessing, and classInitialStateRetrieve
     * cannot be extracted for external operations
     * is that a simple external call cannot access these internal related data,
     * so they have to be written inside createStore.
     */
    [__CLASS_CONNECT_STORE_KEY__, this.classConnectStore],
    [__CLASS_UNMOUNT_PROCESSING_KEY__, this.classUnmountProcessing],
    [__CLASS_INITIAL_STATE_RETRIEVE_KEY__, this.initialStateRetrieve],
  ] as [keyof ExternalMapValue<S>, ValueOf<ExternalMapValue<S>>][]);
}
