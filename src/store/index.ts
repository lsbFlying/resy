/**
 * created by liushanbao
 * @description An easy-to-use React state manager
 * @author liushanbao
 * @date 2022-05-05
 * @name createStore
 */
import type {
  ExternalMapType, ExternalMapValue, StateFnType, StoreMap, StoreOptions,
  Store, StateCallback, StoreMapValueType, State, InitialState,
  StateRefCounterMapType, StateWithThisType, ClassThisPointerType,
} from "./types";
import type { StateRestoreAccomplishedMapType, InitialFnCanExecMapType } from "../restore/types";
import type { Unsubscribe, ListenerType } from "../subscribe/types";
import type { AnyFn, MapType, ValueOf, PrimitiveState } from "../types";
import type { SchedulerType } from "../scheduler/types";
import { scheduler } from "../scheduler";
import {
  __CLASS_CONNECT_STORE_KEY__, __CLASS_UNMOUNT_PROCESSING_KEY__,
  __CLASS_INITIAL_STATE_RETRIEVE_KEY__,
} from "../classConnect/static";
import { __REGENERATIVE_SYSTEM_KEY__, __USE_STORE_KEY__ } from "./static";
import { hasOwnProperty } from "../utils";
import {
  stateErrorProcessing, optionsErrorProcessing, subscribeErrorProcessing,
  protoPointStoreErrorProcessing, setOptionsErrorProcessing,
} from "../errors";
import {
  pushTask, connectHookUse, finallyBatchProcessing, connectStore, mapToObject,
  objectToMap, classUpdater, connectClassUse, effectStateInStateKeys,
} from "./utils";
import {
  mergeStateKeys, retrieveReducerState,
  deferRestoreProcessing, initialStateRetrieve,
} from "../restore";
import { useSubscription as useSubscriptionCore, willUpdatingProcessing } from "../subscribe";
import { batchUpdate } from "../static";

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
  // Retrieve the reducerState
  const reducerState = initialState === undefined
    ? ({} as StateWithThisType<S>)
    : typeof initialState === "function"
      ? initialState()
      : initialState;

  stateErrorProcessing(reducerState, "createStore");

  optionsErrorProcessing(options);
  const optionsTemp = options
    ? {
      __useConciseStateMode__: options.__useConciseStateMode__ ?? undefined,
      unmountRestore: options.unmountRestore ?? true,
    }
    : { unmountRestore: true };

  const schedulerProcessor = scheduler<S>();

  // Tag counters for data references of store
  const storeStateRefCounterMap: StateRefCounterMapType = new Map().set("counter", 0);

  // Flag indicating that the initialStateRetrieve function is executable
  const initialFnCanExecMap: InitialFnCanExecMapType = new Map();

  // This is the identification of whether the logical execution of the reset recovery is complete (to prevent multiple resets)
  const stateRestoreAccomplishedMap: StateRestoreAccomplishedMapType = new Map();

  // Use Map and Set to improve performance without changing initialState, and Map and Set will be dominant in memory
  const stateMap: MapType<S> = objectToMap(reducerState);
  // Data status of the previous batch
  const prevBatchState: MapType<S> = objectToMap(reducerState);

  // Subscription listener stack
  const listenerSet = new Set<ListenerType<S>>();

  // The core map of store
  const storeMap: StoreMap<S> = new Map();

  // The storage stack of this proxy object for the class component
  const classThisPointerSet = new Set<ClassThisPointerType<S>>();

  const setState = (state: State<S> | StateFnType<S>, callback?: StateCallback<S>) => {
    willUpdatingProcessing(schedulerProcessor, prevBatchState, stateMap);

    let stateTemp = state;

    if (typeof state === "function") {
      // processing of prevState
      stateTemp = (state as StateFnType<S>)(mapToObject(stateMap));
    }

    if (stateTemp !== null) {
      stateErrorProcessing(stateTemp, "setState | syncUpdate");
      // The update of hook is an independent update dispatch action, and traversal processing is needed to unify the stack.
      Object.keys(stateTemp as NonNullable<State<S>>).forEach(key => {
        pushTask(
          key, (stateTemp as S)[key], stateMap, schedulerProcessor,
          optionsTemp, reducerState, storeStateRefCounterMap,
          storeMap, stateRestoreAccomplishedMap, initialFnCanExecMap,
          classThisPointerSet, initialState,
        );
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
            connectStore(
              key, optionsTemp, reducerState, stateMap, storeStateRefCounterMap, storeMap,
              stateRestoreAccomplishedMap, schedulerProcessor, initialFnCanExecMap, classThisPointerSet, initialState,
            ).get(key)!.get("updater") as StoreMapValueType<S>["updater"]
          )();
        });
      });
    }
  };

  // Reset recovery initialization state data
  const restore = (callback?: StateCallback<S>) => {
    willUpdatingProcessing(schedulerProcessor, prevBatchState, stateMap);

    retrieveReducerState(reducerState, initialState);

    const state = {} as State<S>;
    mergeStateKeys(reducerState, prevBatchState).forEach(key => {
      const originValue = reducerState[key];
      if (!Object.is(originValue, stateMap.get(key))) {
        state![key] = originValue;
        pushTask(
          key, originValue, stateMap, schedulerProcessor, optionsTemp, reducerState,
          storeStateRefCounterMap, storeMap, stateRestoreAccomplishedMap, initialFnCanExecMap,
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
      if (effectStateInStateKeys(data.effectState, stateKeys)) listener(data);
    };

    listenerSet.add(listenerWrap);

    // Returns the unsubscribing function, which allows the user to choose whether or not to unsubscribe,
    // because it is also possible that the user wants the subscription to remain in effect.
    return () => listenerSet.delete(listenerWrap as ListenerType<S>);
  };

  // Change options configuration
  const setOptions = (options: { unmountRestore: boolean }) => {
    setOptionsErrorProcessing(options);
    optionsTemp.unmountRestore = options.unmountRestore;
  };

  // Data updates for a single attribute
  const singlePropUpdate = (key: keyof S, value: ValueOf<S>, isDelete?: boolean) => {
    willUpdatingProcessing(schedulerProcessor, prevBatchState, stateMap);
    pushTask(
      key, value, stateMap, schedulerProcessor, optionsTemp,
      reducerState, storeStateRefCounterMap, storeMap,
      stateRestoreAccomplishedMap, initialFnCanExecMap,
      classThisPointerSet, initialState, isDelete,
    );
    finallyBatchProcessing(schedulerProcessor, prevBatchState, stateMap, listenerSet);
    return true;
  };

  /**
   * @description Map for additional related internal objects of store
   * For example, some related functions or identifiers,
   * such as setState, subscribe and internal identity __REGENERATIVE_SYSTEM_KEY__
   */
  const externalMap: ExternalMapType<S> = new Map();

  // Updated handler configuration for proxy
  const proxySetHandler = {
    set: (_: StoreMap<S>, key: keyof S, value: ValueOf<S>) => singlePropUpdate(key, value),
    // Delete will also play an updating role
    deleteProperty: (_: S, key: keyof S) => singlePropUpdate(key, undefined as ValueOf<S>, true),
  } as any as ProxyHandler<StoreMap<S>>;

  // A proxy object with the capabilities of updating and data tracking.
  const store = new Proxy(storeMap, {
    get: (_: StoreMap<S>, key: keyof S, receiver: any) => {
      protoPointStoreErrorProcessing(receiver, store);

      const value = stateMap.get(key);
      if (typeof value === "function") {
        // Bind to the store for the convenience of using this as well as calling some related objects in externalMap.
        return (value as AnyFn).bind(store);
      }

      return externalMap.get(key as keyof ExternalMapValue<S>) || value;
    },
    ...proxySetHandler,
  } as any as ProxyHandler<StoreMap<S>>) as any as Store<S>;

  // Proxy of driver update re-render for useStore
  const engineStore = new Proxy(storeMap, {
    get: (_: StoreMap<S>, key: keyof S) => {
      const value = stateMap.get(key);

      // Error message alerting to the confusion and improper use of function property data and state,
      // which does not adhere to the hook usage convention.
      const errorMsg = `The outer function of ${key as string} is used as a hook state,`
        + ` but it does not comply with the hook usage rules. Please check if the outer function where ${key as string} is called`
        + " is being destructured inside useStore or useConciseState."
        + ` If the outer function of ${key as string} does not need to be used as a hook state,`
        + " then please call it directly through the store.";

      if (typeof value === "function") {
        try {
          // Invoke a function data hook to grant the ability to update and render function data.
          connectHookUse(
            key, optionsTemp, reducerState, stateMap, storeStateRefCounterMap, storeMap,
            stateRestoreAccomplishedMap, schedulerProcessor, initialFnCanExecMap, classThisPointerSet, initialState,
          );
          // todo Consider how to optimize the irrelevant data changes of getters and computed without repeated execution.
          // Bind engineStore to realize the ability of getters and computed
          // connectHookUse will record the key of state again to make useState calls.
          return (value as AnyFn).bind(engineStore);
        } catch (e) {
          console.error(new Error(errorMsg));
          return (value as AnyFn).bind(store);
        }
      }
      try {
        return externalMap.get(key as keyof ExternalMapValue<S>) || connectHookUse(
          key, optionsTemp, reducerState, stateMap, storeStateRefCounterMap, storeMap,
          stateRestoreAccomplishedMap, schedulerProcessor, initialFnCanExecMap, classThisPointerSet, initialState,
        );
      } catch (e) {
        console.error(new Error(errorMsg));
        return externalMap.get(key as keyof ExternalMapValue<S>) || value;
      }
    },
    ...proxySetHandler,
  } as any as ProxyHandler<StoreMap<S>>);

  externalMap.set("setState", setState);
  externalMap.set("syncUpdate", syncUpdate);
  externalMap.set("restore", restore);
  externalMap.set("subscribe", subscribe);
  externalMap.set(__REGENERATIVE_SYSTEM_KEY__, __REGENERATIVE_SYSTEM_KEY__);

  if (optionsTemp.__useConciseStateMode__) {
    // Enable useConciseState to have data tracking capabilities through the store
    externalMap.set("store", store);
  } else {
    /**
     * @description useConciseState should not possess the capability
     * of the setOptions since local state control would become chaotic if there is local caching.
     * Caching is more meaningful in the context of the entire store.
     */
    externalMap.set("setOptions", setOptions);
  }

  /**
   * It is convenient for store.useStore() to call directly
   * 🌟 The reason why it is not changed to store.useStore
   * is due to the consideration of the rules for the use of the hook function.
   */
  const useStore = () => engineStore;

  const useSubscription = (listener: ListenerType<S>, stateKeys?: (keyof S)[]) => {
    useSubscriptionCore(store, listener, stateKeys);
  };

  // Connecting this pointer of the class component (therefore, this cannot be an arrow function)
  function classConnectStore(this: ClassThisPointerType<S>) {
    classThisPointerSet.add(this);
    // Data agents for use by class
    const classEngineStore = new Proxy(storeMap, {
      get: (_: StoreMap<S>, key: keyof S) => {
        if (typeof stateMap.get(key) === "function") {
          // A function is counted as a data variable if it has a reference
          connectClassUse.bind(this)(key, stateMap);
          // todo Consider how to optimize the irrelevant data changes of getters and computed without repeated execution.
          // Bind classEngineStore to realize the ability of getters and computed
          // connectClassUse will record data references render to state's key again.
          return (stateMap.get(key) as AnyFn).bind(classEngineStore);
        }
        return externalMap.get(key as keyof ExternalMapValue<S>)
          || connectClassUse.bind(this)(key, stateMap);
      },
      set: (_: StoreMap<S>, key: keyof S, value: ValueOf<S>) => singlePropUpdate(key, value),
      deleteProperty: (_: S, key: keyof S) => singlePropUpdate(key, undefined as ValueOf<S>, true),
    } as any as ProxyHandler<StoreMap<S>>);
    return classEngineStore;
  }

  // Unmount execution of class components
  function classUnmountProcessing(this: ClassThisPointerType<S>) {
    classThisPointerSet.delete(this);
    deferRestoreProcessing(
      optionsTemp, reducerState, stateMap, storeStateRefCounterMap,
      stateRestoreAccomplishedMap, schedulerProcessor, initialFnCanExecMap,
      classThisPointerSet, initialState,
    );
  }

  // The initialization function of createStore resets the recovery process for class component
  const classInitialStateRetrieve = () => {
    initialStateRetrieve(
      reducerState, stateMap, storeStateRefCounterMap, stateRestoreAccomplishedMap,
      initialFnCanExecMap, classThisPointerSet, initialState,
    );
  };

  externalMap.set("useStore", useStore);
  externalMap.set("useSubscription", useSubscription);
  externalMap.set(__USE_STORE_KEY__, engineStore);
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

  return store;
};
