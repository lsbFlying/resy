/**
 * created by liushanbao
 * @description An easy-to-use React state manager
 * @author liushanbao
 * @date 2022-05-05
 * @name createStore
 */
import type {
  ExternalMapType, ExternalMapValue, StateFnType, StoreMap, StoreOptions, Store,
  StateCallback, StoreMapValueType, State, InitialState, StateRefCounterMapType,
  StateWithThisType, InnerStoreOptions, AnyBoundFn,
} from "./types";
import type { InitialFnCanExecMapType } from "../restore/types";
import type { Unsubscribe, ListenerType } from "../subscribe/types";
import type { AnyFn, MapType, ValueOf, PrimitiveState } from "../types";
import type { ClassInstanceTypeOfConnectStore } from "../class-connect/types";
import type { SchedulerType } from "../scheduler/types";
import type { ApplyOriginFunctionType, KeyChainsSourceItemType } from "../immutable/types";
import { __MAP_SET_PROTOTYPE_PROXYABLE_TARGET__ } from "../immutable";
import { proxyable, createNewRefValue, reduceChanged } from "../immutable/utils";
import { scheduler } from "../scheduler";
import {
  __CLASS_CONNECT_STORE_KEY__, __CLASS_UNMOUNT_PROCESSING_KEY__,
  __CLASS_INITIAL_STATE_RETRIEVE_KEY__,
} from "../class-connect/static";
import {
  __REGENERATIVE_SYSTEM_KEY__, __STORE_NAMESPACE__, __USE_STORE_KEY__, __GETTERS_PREFIX__,
} from "./static";
import { hasOwnProperty } from "../utils";
import {
  stateErrorProcessing, optionsErrorProcessing,
  subscribeErrorProcessing, setOptionsErrorProcessing,
} from "./errors";
import {
  pushTask, connectHook, finallyBatchProcessing, hookConnectStore, classUpdater,
  connectClass, effectStateInListenerKeys, boundFnProcessing,
} from "./core";
import { mapToObject, objectToMap } from "./utils";
import {
  mergeStateKeys, retrieveReducerState, deferRestoreProcessing, initialStateRetrieve,
} from "../restore";
import { useSubscription as useSubscriptionCore } from "../subscribe";
import { willUpdatingProcessing } from "../subscribe/utils";
import { __DEV__, batchUpdate } from "../static";
import { useDebugValue, useEffect, useState } from "react";

/**
 * createStore
 * created by liushanbao
 * @description Create a state storage container that can be used globally
 * @author liushanbao
 * @date 2022-05-05
 * @param initialState
 * @param options
 * @return Store<S>
 */
export const createStore = <S extends PrimitiveState>(
  initialState?: InitialState<S>,
  options?: StoreOptions,
): Store<S> => {
  /** ============================== For core constant ready start ============================== */
  // Retrieve the reducerState
  const reducerState = initialState === undefined
    ? ({} as StateWithThisType<S>)
    : typeof initialState === "function"
      ? initialState()
      : initialState;

  optionsErrorProcessing(options);
  const optionsTemp = {
    unmountRestore: options?.unmountRestore ?? true,
    namespace: options?.namespace ?? undefined,
    immutable: options?.immutable ?? undefined,
    enableMarcoActionStateful: options?.enableMarcoActionStateful ?? undefined,
    __useConciseState__: (options as InnerStoreOptions)?.__useConciseState__ ?? undefined,
    __enableMacros__: (options as InnerStoreOptions)?.__enableMacros__ ?? undefined,
    __functionName__: (options as InnerStoreOptions)?.__functionName__ ?? createStore.name,
  };

  const { immutable } = optionsTemp;

  stateErrorProcessing({ state: reducerState, options: optionsTemp });

  const schedulerProcessor = scheduler<S>();

  // Tag counters for data references of store
  const storeStateRefCounterMap: StateRefCounterMapType = new Map().set("counter", 0);

  // Flag indicating that the initialStateRetrieve function is executable
  const initialFnCanExecMap: InitialFnCanExecMapType = new Map();

  /**
   * @description Use Map and Set to improve performance,
   * "Simultaneously, it can keep the `initialState` unchanged."
   */
  const stateMap: MapType<S> = objectToMap(reducerState);
  // Data status of the previous update batch
  const prevBatchState: MapType<S> = objectToMap(reducerState);

  // Subscription listener stack
  const listenerSet = new Set<ListenerType<S>>();
  // Dependency Collection for getters or computed
  const computedStateDepsSet = new Set<keyof S>();

  // The core map of store
  const storeMap: StoreMap<S> = new Map();

  // The storage stack of this proxy object for the class component
  const classThisPointerSet = new Set<ClassInstanceTypeOfConnectStore<S>>();

  /**
   * @description Map for additional related internal objects of store
   * For example, some related functions or identifiers,
   * such as setState, subscribe and internal identity __REGENERATIVE_SYSTEM_KEY__
   */
  const externalMap: ExternalMapType<S> = new Map();
  /** ============================== For core constant ready end ============================== */

  // for development tools
  externalMap.set(__STORE_NAMESPACE__, optionsTemp.namespace);

  /** ============================== For core utils use start ============================== */
  const setState = (state: State<S> | StateFnType<S>, callback?: StateCallback<S>) => {
    willUpdatingProcessing(listenerSet, schedulerProcessor, prevBatchState, stateMap);

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
        if (!Object.is(value, stateMap.get(key))) {
          pushTask(
            key, value, stateMap, schedulerProcessor, optionsTemp, reducerState,
            storeStateRefCounterMap, storeMap, initialFnCanExecMap,
            classThisPointerSet, initialState,
          );
        }
      });
    }

    (schedulerProcessor.get("pushCallbackStack") as SchedulerType<S>["pushCallbackStack"])(
      stateMap, stateTemp as State<S>, callback,
    );

    finallyBatchProcessing(schedulerProcessor, prevBatchState, stateMap, listenerSet);
  };

  /**
   * @description syncUpdate primarily exists to address issues with normal text input.
   * to meet the needs of normal text input, it synchronizes React's update scheduling.
   */
  const syncUpdate = (state: State<S> | StateFnType<S>, callback?: StateCallback<S>) => {
    let stateTemp = state;

    if (typeof state === "function") {
      stateTemp = (state as StateFnType<S>)(mapToObject(stateMap));
    }
    // Borrowing setState to synchronize the update scheduling mechanism of Resy itself.
    setState(stateTemp, callback);

    if (stateTemp !== null) {
      batchUpdate(() => {
        Object.keys(stateTemp as NonNullable<State<S>>).forEach(key => {
          const value = (stateTemp as Partial<S> | S)[key];
          classUpdater(key, value, classThisPointerSet);
          (
            hookConnectStore(
              key, optionsTemp, reducerState, stateMap, storeStateRefCounterMap,
              storeMap, schedulerProcessor, initialFnCanExecMap,
              classThisPointerSet, initialState,
            ).get(key)!.get("updater") as StoreMapValueType<S>["updater"]
          )();
        });
      });
    }
  };

  // Reset recovery initialization state data
  const restore = (callback?: StateCallback<S>) => {
    willUpdatingProcessing(listenerSet, schedulerProcessor, prevBatchState, stateMap);

    retrieveReducerState(reducerState, initialState);

    const state = {} as State<S>;
    mergeStateKeys(reducerState, stateMap).forEach(key => {
      const originValue = reducerState[key];
      if (!Object.is(originValue, stateMap.get(key))) {
        state![key] = originValue;
        pushTask(
          key, originValue, stateMap, schedulerProcessor, optionsTemp,
          reducerState, storeStateRefCounterMap, storeMap, initialFnCanExecMap,
          classThisPointerSet, initialState, !hasOwnProperty.call(reducerState, key),
        );
      }
    });

    (schedulerProcessor.get("pushCallbackStack") as SchedulerType<S>["pushCallbackStack"])(
      stateMap, state, callback,
    );

    finallyBatchProcessing(schedulerProcessor, prevBatchState, stateMap, listenerSet);
  };

  // Subscription function
  const subscribe = (listener: ListenerType<S>, stateKeys?: (keyof S)[]): Unsubscribe => {
    subscribeErrorProcessing(listener, stateKeys);
    const listenerWrap: ListenerType<S> = data => {
      if (effectStateInListenerKeys(data.effectState, stateKeys)) listener(data);
    };

    listenerSet.add(listenerWrap);

    // Returns the unsubscribing function, which allows the user to choose whether or not to unsubscribe,
    // because it is also possible that the user wants the subscription to remain in effect.
    return () => listenerSet.delete(listenerWrap as ListenerType<S>);
  };

  externalMap.set("setState", setState);
  externalMap.set("syncUpdate", syncUpdate);
  externalMap.set("restore", restore);
  externalMap.set("subscribe", subscribe);
  /** ============================== For core utils use end ============================== */

  /** ============================== For core render use start ============================== */
  // Data updates for a single attribute
  const singleUpdate = (
    key: keyof S,
    value: ValueOf<S>,
    isDelete = false,
    target: object | S = stateMap,
    firstLevelKey?: keyof S,
    keyChains?: Set<KeyChainsSourceItemType<S>>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _applyOriginFunction?: ApplyOriginFunctionType,
  ): boolean => {
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
        ? singleUpdate(
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
        willUpdatingProcessing(listenerSet, schedulerProcessor, prevBatchState, stateMap);
        pushTask(
          key, value, stateMap, schedulerProcessor, optionsTemp, reducerState,
          storeStateRefCounterMap, storeMap, initialFnCanExecMap,
          classThisPointerSet, initialState, isDelete,
        );
        finallyBatchProcessing(schedulerProcessor, prevBatchState, stateMap, listenerSet);
      }
      return true;
    }
  };

  const createProxy = (
    target: object,
    parentTarget: any = stateMap,
    firstLevelKey?: keyof S,
    keyLevel?: number,
    keyChains?: Set<KeyChainsSourceItemType<S>>,
    applyOriginFunction?: ApplyOriginFunctionType,
  ) => {
    return new Proxy(target, {
      get: (_: S, key: keyof S) => {
        const isStateSource = target === stateMap;

        const value = isStateSource
          ? stateMap.get(key)
          : (target as S)[key];

        isStateSource && computedStateDepsSet.add(key);

        const externalValue = externalMap.get(key as keyof ExternalMapValue<S>);

        if (!externalValue && immutable && proxyable(value)) {
          return createProxy(
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
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          return boundFnProcessing(key, value, target, stateMap, store);
        }

        return !externalValue ? value : externalValue;
      },
      set: (_: S, key: keyof S, value: ValueOf<S>) => singleUpdate(
        key, value, false, target, firstLevelKey,
        new Set(keyChains).add({ key }), applyOriginFunction,
      ),
      // Delete will also play an updating role
      deleteProperty: (_: S, key: keyof S) => singleUpdate(
        key, undefined as ValueOf<S>, true, target, firstLevelKey,
        new Set(keyChains).add({ key }), applyOriginFunction,
      ),
      // The `apply` here is written specifically for prototype chain functions
      // that are applicable to proxyable types such as `Map`, and `Set`.
      apply: (applyOriginFunction: any, thisArg: any, argArray: any[]) => Reflect.apply(
        __MAP_SET_PROTOTYPE_PROXYABLE_TARGET__.get(applyOriginFunction)!(
          applyOriginFunction, thisArg, stateMap, parentTarget as any,
          createProxy, firstLevelKey, keyLevel, keyChains, singleUpdate,
        ),
        thisArg,
        argArray,
      ),
    } as ProxyHandler<S>) as Store<S>;
  };

  // A proxy object with the capabilities of updating and data tracking.
  const store = createProxy(stateMap);

  // Proxy of driver update re-render for useStore
  const engineStore = new Proxy(stateMap, {
    get: (_: StoreMap<S>, key: keyof S) => {
      // Get the latest value
      const value = stateMap.get(key);

      const externalValue = externalMap.get(key as keyof ExternalMapValue<S>);

      if (!externalValue && typeof value !== "function") {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        __DEV__ && useDebugValue({
          key,
          value,
          ...(
            optionsTemp.namespace
              ? { namespace: optionsTemp.namespace }
              : null
          ),
        });

        return connectHook(
          key, optionsTemp, reducerState, stateMap, storeStateRefCounterMap,
          storeMap, schedulerProcessor, initialFnCanExecMap,
          classThisPointerSet, initialState,
        );
      }

      if (!externalValue && typeof value === "function") {
        // Avoid memory redundancy waste caused by repeated bindings and maintain the function reference address unchanged.
        !(value as AnyBoundFn).__bound__ && boundFnProcessing(key, value, stateMap, stateMap, store);

        const fnStateful = !optionsTemp.__enableMacros__ || optionsTemp.enableMarcoActionStateful;

        const boundFnValue = stateMap.get(key);

        // eslint-disable-next-line react-hooks/rules-of-hooks
        fnStateful && __DEV__ && useDebugValue({
          key,
          value: boundFnValue,
          ...(
            optionsTemp.namespace
              ? { namespace: optionsTemp.namespace }
              : null
          ),
        });

        /**
         * @description Enable function properties to have the ability to update rendering.
         * Placing both the __bound__ and the stateMap's set operation before the connectHook
         * can preemptively avoid the tearing synchronization handling inside useSyncExternalStore,
         * resulting in twice the redundant rendering execution.
         */
        fnStateful && connectHook(
          key, optionsTemp, reducerState, stateMap, storeStateRefCounterMap,
          storeMap, schedulerProcessor, initialFnCanExecMap,
          classThisPointerSet, initialState,
        );

        return !key.toString().startsWith(__GETTERS_PREFIX__)
          ? boundFnValue
          // TODO waiting upgrade optimize (暂时应该没有属性依赖记录收集销毁的逻辑问题)
          : () => {
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
            }, stateKeys), [stateKeys]);

            return result;
          };
      }

      return externalValue;
    },
  } as ProxyHandler<MapType<S>>);

  // Enable useConciseState and defineStore to have data tracking capabilities through the store
  if (optionsTemp.__useConciseState__ || optionsTemp.__enableMacros__) {
    externalMap.set("store", store);
  }
  /**
   * @description Here, __USE_STORE_KEY__ is not placed under the branch where optionsTemp.__mode__ === "state",
   * because computed needs the rendering capability of engineStore.
   */
  externalMap.set(__USE_STORE_KEY__, engineStore);
  externalMap.set(__REGENERATIVE_SYSTEM_KEY__, __REGENERATIVE_SYSTEM_KEY__);
  /** ============================== For core render use end ============================== */

  /** ============================== For operate options use start ============================== */
  // Change options configuration
  const setOptions = (options: { unmountRestore: boolean }) => {
    setOptionsErrorProcessing(options);
    optionsTemp.unmountRestore = options.unmountRestore;
  };

  const getOptions = () => Object.assign({}, optionsTemp);

  externalMap.set("setOptions", setOptions);
  externalMap.set("getOptions", getOptions);
  /** ============================== For operate options use end ============================== */

  /** ============================== For hook components use start ============================== */
  /**
   * It is convenient for store.useStore() to call directly
   * 🌟 The reason why it is not changed to store.useStore
   * is due to the consideration of the rules for the use of the hook function.
   */
  const useStore = () => engineStore;

  const useSubscription = (listener: ListenerType<S>, stateKeys?: (keyof S)[]) => {
    if (__DEV__) {
      const store_namespace = optionsTemp.namespace
        ? { namespace: optionsTemp.namespace }
        : null;
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useDebugValue({
        listener,
        stateKeys,
        ...store_namespace,
      });
    }
    useSubscriptionCore(store, listener, stateKeys);
  };

  externalMap.set("useStore", useStore);
  externalMap.set("useSubscription", useSubscription);
  /** ============================== For hook components use end ============================== */

  /** ============================== For class components use start ============================== */
  // Connecting this pointer of the class component (therefore, this cannot be an arrow function)
  function classConnectStore(this: ClassInstanceTypeOfConnectStore<S>) {
    classThisPointerSet.add(this);
    // Data agents for use by class components
    const classEngineStore = new Proxy(stateMap, {
      get: (_: StoreMap<S>, key: keyof S) => {
        // Compatible with scenarios where both hook components and class components are used together.
        if (key === "useStore") return () => classEngineStore;

        const value = stateMap.get(key);

        return externalMap.get(key as keyof ExternalMapValue<S>) || (
          typeof value !== "function"
            ? connectClass.apply(this, [key, stateMap] as any)
            // Invoke a function data hook to grant the ability to update and render function data.
            : (...args: any[]) => (
              connectClass.apply(this, [key, stateMap] as any) as AnyFn
            ).apply(classEngineStore, args)
        );
      },
    } as ProxyHandler<MapType<S>>);
    return classEngineStore;
  }

  // Unmount execution of class components
  function classUnmountProcessing(this: ClassInstanceTypeOfConnectStore<S>) {
    classThisPointerSet.delete(this);
    deferRestoreProcessing(
      optionsTemp, reducerState, stateMap, storeStateRefCounterMap,
      schedulerProcessor, initialFnCanExecMap,
      classThisPointerSet, initialState,
    );
  }

  // The initialization function of createStore resets the recovery process for class component
  const classInitialStateRetrieve = () => {
    initialStateRetrieve(reducerState, stateMap, initialFnCanExecMap, initialState);
  };

  /**
   * @description The reason why the three operation functions for class components
   * — connect, classUnmountProcessing, and classInitialStateRetrieve
   * cannot be extracted for external operations
   * is that a simple external call cannot access these internal related data,
   * so they have to be written inside createStore.
   */
  externalMap.set(__CLASS_CONNECT_STORE_KEY__, classConnectStore);
  externalMap.set(__CLASS_UNMOUNT_PROCESSING_KEY__, classUnmountProcessing);
  externalMap.set(__CLASS_INITIAL_STATE_RETRIEVE_KEY__, classInitialStateRetrieve);
  /** ============================== For class components use end ============================== */

  return store;
};
