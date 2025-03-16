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
  StateWithThisType, InnerStoreOptions, AnyBoundFn, ArrayPrototypeProxyableValueType,
} from "./types";
import type { InitialFnCanExecMapType } from "../restore/types";
import type { Unsubscribe, ListenerType } from "../subscribe/types";
import type { AnyFn, MapType, ValueOf, PrimitiveState } from "../types";
import type { ClassInstanceTypeOfConnectStore } from "../class-connect/types";
import type { SchedulerType } from "../scheduler/types";
import { scheduler } from "../scheduler";
import {
  __CLASS_CONNECT_STORE_KEY__, __CLASS_UNMOUNT_PROCESSING_KEY__,
  __CLASS_INITIAL_STATE_RETRIEVE_KEY__,
} from "../class-connect/static";
import {
  __KEY_CHAINS_CONCAT_SYMBOL__,
  __REGENERATIVE_SYSTEM_KEY__, __STORE_NAMESPACE__, __USE_STORE_KEY__,
} from "./static";
import { hasOwnProperty } from "../utils";
import {
  stateErrorProcessing, optionsErrorProcessing, subscribeErrorProcessing,
  protoPointStoreErrorProcessing, setOptionsErrorProcessing,
} from "./errors";
import {
  pushTask, connectHook, finallyBatchProcessing, hookConnectStore, classUpdater,
  connectClass, effectStateInListenerKeys, boundFnProcessing,
} from "./core";
import { __ARRAY_PROTOTYPE_PROXYABLE_TARGET_MAP__ } from "./array";
import {
  mapToObject, objectToMap, proxyable, createNewRefValue, isArrayPrototypeProxyable,
} from "./utils";
import {
  mergeStateKeys, retrieveReducerState, deferRestoreProcessing, initialStateRetrieve,
} from "../restore";
import { useSubscription as useSubscriptionCore } from "../subscribe";
import { willUpdatingProcessing } from "../subscribe/utils";
import { __DEV__, batchUpdate } from "../static";
import { useDebugValue } from "react";

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

  // The core map of store
  const storeMap: StoreMap<S> = new Map();

  const storeProxyWeakMap = new WeakMap<object, Store<S>>();

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
    // todo waiting target type become ProxyableType<S>(includes Map and Set type)
    target: any = stateMap,
    firstLevelKey?: keyof S | null,
    keyChains?: string,
    applyOriginFunction?: ArrayPrototypeProxyableValueType,
  ): boolean => {
    if (target !== stateMap) {
      const prevValue = target[key];

      const changed = !Object.is(prevValue, value);
      if (changed) {
        const firstLevelRootValue = stateMap.get(firstLevelKey!);

        const noHeadKeyChains = keyChains!.split(__KEY_CHAINS_CONCAT_SYMBOL__);
        noHeadKeyChains.shift();

        noHeadKeyChains.reduce((
          previousValue,
          itemKey,
          currentIndex,
          array,
        ) => {
          currentIndex !== array.length - 1
            ? ((previousValue as any)[itemKey] = createNewRefValue((previousValue as S)[itemKey]))
            : ((previousValue as S)[key] = value);
          return (previousValue as S)[itemKey];
        }, firstLevelRootValue);

        // todo 父元素对象一旦更新，立即销毁之前的代理对象，否则会使得数组原型链代理函数中拿不到最新的父元素对象parentTarget
        //  这里是为了弥补loop循环遍历的时候通过item进行异变更新的场景，而进行的感知补充性销毁，
        //  因为这里的applyOriginFunction只有在item会有代理的场景才会传入
        applyOriginFunction && storeProxyWeakMap.delete(applyOriginFunction);
      }

      return changed
        ? singleUpdate(
          firstLevelKey!,
          createNewRefValue(stateMap.get(firstLevelKey!)) as ValueOf<S>,
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
    // todo waiting target type become ProxyableType<S>(includes Map and Set type)
    target: object,
    parentTarget: any = stateMap,
    firstLevelKey?: keyof S,
    keyChains?: string,
    applyOriginFunction?: ArrayPrototypeProxyableValueType,
  ) => {
    const spw = storeProxyWeakMap.get(target);
    if (spw) return spw;

    const isStateMap = target === stateMap;

    const sp = new Proxy(target, {
      get: (_: S, key: keyof S, receiver: any) => {
        protoPointStoreErrorProcessing(receiver, sp);

        const externalValue = externalMap.get(key as keyof ExternalMapValue<S>);
        if (externalValue) return externalValue;

        const value = isStateMap
          ? stateMap.get(key)
          : (target as S)[key];

        const IPPA = isArrayPrototypeProxyable(value);
        // todo 代理数组原型链上面的函数
        if (immutable && (proxyable(value) || IPPA)) {
          return createProxy(
            value as object,
            target,
            firstLevelKey ?? key,
            keyChains
              ? IPPA
                ? keyChains
                : `${keyChains}${__KEY_CHAINS_CONCAT_SYMBOL__}${key?.toString()}`
              : key?.toString(),
          );
        }

        if (typeof value === "function" && !(value as AnyBoundFn).__bound__) {
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          return boundFnProcessing(key, value, target, stateMap, store);
        }

        return value;
      },
      set: (_: S, key: keyof S, value: ValueOf<S>) => singleUpdate(
        key, value, false, target, firstLevelKey,
        `${keyChains}${__KEY_CHAINS_CONCAT_SYMBOL__}${key?.toString()}`, applyOriginFunction,
      ),
      // Delete will also play an updating role
      deleteProperty: (_: S, key: keyof S) => singleUpdate(
        key, undefined as ValueOf<S>, true, target, firstLevelKey,
        `${keyChains}${__KEY_CHAINS_CONCAT_SYMBOL__}${key?.toString()}`, applyOriginFunction,
      ),
      /**
       * TODO 这里的apply是针对Array、Map、Set类型的原型链函数的代理执行而写的
       *  先实现Array类型的，Map、Set后续再推进
       */
      apply(applyOriginFunction: any, thisArg: any, argArray: any[]) {
        return Reflect.apply(
          __ARRAY_PROTOTYPE_PROXYABLE_TARGET_MAP__.get(applyOriginFunction.name)!(
            storeProxyWeakMap, applyOriginFunction, thisArg,
            parentTarget, createProxy, firstLevelKey, keyChains,
          ),
          thisArg ?? sp,
          argArray,
        );
      },
    } as ProxyHandler<S>) as Store<S>;

    storeProxyWeakMap.set(target, sp);

    return sp;
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
        if (!(value as AnyBoundFn).__bound__) {
          boundFnProcessing(key, value, stateMap, stateMap, store);
        }

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

        return boundFnValue;
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
