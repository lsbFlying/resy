import type { PrimitiveState, ValueOf, MapType, Callback } from "../types";
import type {
  StoreMapValue, StoreMapValueType, StoreMap, InitialState,
  StateRefCounterMapType, State, StoreOptions,
} from "./types";
import type { SignalMetaMapType } from "../signal/types";
import type { SchedulerType } from "../scheduler/types";
import type { ListenerParams, ListenerType } from "../subscribe/types";
import type { InitialFnCanExecMapType } from "../restore/types";
import type { ClassInstanceTypeOfConnectStore } from "../classConnect/types";
import useSyncExternalStoreExports from "use-sync-external-store/shim";
import { initialStateRetrieve, deferRestoreProcessing } from "../restore";
import { batchUpdate } from "../static";
import { __CLASS_STATE_REF_SET_KEY__ } from "../classConnect/static";
import { shallowCloneMap, mapToObject } from "./utils";

/**
 * @description Additional references are utilized to ensure the compatibility
 * of the package in ESM since 'use-sync-external-store' only exports in CJS format.
 */
const { useSyncExternalStore } = useSyncExternalStoreExports;

/**
 * @description By connecting the core mapping variable storeMap within the store,
 * a series of operations such as tagging, subscribing, updating, tracking, and rendering are completed.
 */
export const connectStore = <S extends PrimitiveState>(
  key: keyof S,
  options: StoreOptions,
  reducerState: S,
  stateMap: MapType<S>,
  storeStateRefCounterMap: StateRefCounterMapType,
  storeMap: StoreMap<S>,
  schedulerProcessor: MapType<SchedulerType<S>>,
  initialFnCanExecMap: InitialFnCanExecMapType,
  classThisPointerSet: Set<ClassInstanceTypeOfConnectStore<S>>,
  signalMetaMap: SignalMetaMapType<S>,
  initialState?: InitialState<S>,
) => {
  // Resolve the problem that the initialization attribute may be undefined
  if (storeMap.has(key)) return storeMap;

  const storeMapValue: StoreMapValue<S> = new Map();
  // The Set memory of the update function of a single attribute
  const singleStoreChangeSet = new Set<Callback>();

  storeMapValue.set("subscribeOriginState", (onOriginStateChange: Callback) => {
    // If a component references the data, the update function will be added to singleStoreChangeSet
    singleStoreChangeSet.add(onOriginStateChange);

    // Increment the reference count by 1 if the component is referenced
    storeStateRefCounterMap.set("counter", storeStateRefCounterMap.get("counter")! + 1);

    return () => {
      singleStoreChangeSet.delete(onOriginStateChange);
      storeStateRefCounterMap.set("counter", storeStateRefCounterMap.get("counter")! - 1);

      deferRestoreProcessing(
        options, reducerState, stateMap, storeStateRefCounterMap,
        schedulerProcessor, initialFnCanExecMap, classThisPointerSet,
        signalMetaMap, initialState, () => {
          // Release memory if there are no component references
          if (!singleStoreChangeSet.size) {
            storeMap.delete(key);
          }
        },
      );
    };
  });

  storeMapValue.set("getOriginState", () => stateMap.get(key));

  storeMapValue.set("useOriginState", () => useSyncExternalStore(
    (storeMap.get(key) as StoreMapValue<S>).get("subscribeOriginState") as StoreMapValueType<S>["subscribeOriginState"],
    (storeMap.get(key) as StoreMapValue<S>).get("getOriginState") as StoreMapValueType<S>["getOriginState"],
    (storeMap.get(key) as StoreMapValue<S>).get("getOriginState") as StoreMapValueType<S>["getOriginState"],
  ));

  storeMapValue.set("updater", () => {
    singleStoreChangeSet.forEach(stateChange => {
      stateChange();
    });
  });

  storeMap.set(key, storeMapValue);

  return storeMap;
};

/**
 * @description It is essentially a call to useSyncExternalStore,
 * concatenating a series of operations through the core storeMap generated in connectStore.
 */
export const connectHook = <S extends PrimitiveState>(
  key: keyof S,
  options: StoreOptions,
  reducerState: S,
  stateMap: MapType<S>,
  storeStateRefCounterMap: StateRefCounterMapType,
  storeMap: StoreMap<S>,
  schedulerProcessor: MapType<SchedulerType<S>>,
  initialFnCanExecMap: InitialFnCanExecMapType,
  classThisPointerSet: Set<ClassInstanceTypeOfConnectStore<S>>,
  signalMetaMap: SignalMetaMapType<S>,
  initialState?: InitialState<S>,
) => {
  // Perform refresh recovery logic if initialState is a function
  initialStateRetrieve(reducerState, stateMap, initialFnCanExecMap, signalMetaMap, initialState);
  return (
    connectStore(
      key, options, reducerState, stateMap, storeStateRefCounterMap,
      storeMap, schedulerProcessor, initialFnCanExecMap,
      classThisPointerSet, signalMetaMap, initialState,
    ).get(key)!.get("useOriginState") as StoreMapValueType<S>["useOriginState"]
  )();
};

/**
 * @description The corresponding connectHook and connectClass are for class components,
 * but they only need to make the corresponding tags and return the data.
 */
export function connectClass<S extends PrimitiveState>(
  this: any,
  key: keyof S,
  stateMap: MapType<S>,
) {
  // In class, Set is used for reference tags and combined with the size attribute of Set to judge.
  this[__CLASS_STATE_REF_SET_KEY__].add(key);
  return stateMap.get(key);
}

// State updates for class components
export const classUpdater = <S extends PrimitiveState>(
  key: keyof S,
  value: ValueOf<S>,
  classThisPointerSet: Set<ClassInstanceTypeOfConnectStore<S>>,
) => {
  classThisPointerSet?.forEach(classThisPointerItem => {
    /**
     * There is an "updater" attribute on the internal this pointer of react's class,
     * and an "isMounted" method is mounted on it to determine whether the component has been loaded.
     * If it is in "React.StrictMode" mode,
     * React will discard the first generated instance and the instance will not be mounted.
     */
    if (classThisPointerItem.updater.isMounted(classThisPointerItem)) {
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
       * and the signal mode does not require class components to use Api such as ComponentWithStore to connect to the store,
       * but it is necessary to prevent scenarios where unintended invalid code is used. 😯
       */
      classThisPointerItem[__CLASS_STATE_REF_SET_KEY__]?.has(key) && (
        classThisPointerItem.setState({ [key]: value } as State<S>)
      );
    } else {
      classThisPointerSet.delete(classThisPointerItem);
    }
  });
};

// Add the update task to the stack
export const pushTask = <S extends PrimitiveState>(
  key: keyof S,
  value: ValueOf<S>,
  stateMap: MapType<S>,
  schedulerProcessor: MapType<SchedulerType<S>>,
  options: StoreOptions,
  reducerState: S,
  storeStateRefCounterMap: StateRefCounterMapType,
  storeMap: StoreMap<S>,
  initialFnCanExecMap: InitialFnCanExecMapType,
  classThisPointerSet: Set<ClassInstanceTypeOfConnectStore<S>>,
  signalMetaMap: SignalMetaMapType<S>,
  initialState?: InitialState<S>,
  isDelete?: boolean,
) => {
  // The pre-execution of the data changes accumulates the logic of the correct execution of the final update,
  // which lays the foundation for subsequent batch updates.
  !isDelete ? stateMap.set(key, value) : stateMap.delete(key);

  (schedulerProcessor.get("pushTask") as SchedulerType<S>["pushTask"])(
    key,
    value,
    () => {
      classUpdater(key, value, classThisPointerSet);
      /**
       * @description The decision not to execute the updates for class components within the following updater
       * is to preserve the simplicity of the update scheduling for both hook and class components.
       */
      // Status updates for hook components
      (
        connectStore(
          key, options, reducerState, stateMap, storeStateRefCounterMap,
          storeMap, schedulerProcessor, initialFnCanExecMap,
          classThisPointerSet, signalMetaMap, initialState,
        ).get(key)!.get("updater") as StoreMapValueType<S>["updater"]
      )();
    },
  );
};

/**
 * @description Final batch update processing
 * With the help of the micro-task event loop via 'then',
 * the update execution of data and tasks are placed onto the stack, and subsequently flushed.
 */
export const finallyBatchProcessing = <S extends PrimitiveState>(
  schedulerProcessor: MapType<SchedulerType<S>>,
  prevBatchState: MapType<S>,
  stateMap: MapType<S>,
  listenerSet: Set<ListenerType<S>>,
) => {
  const {
    taskDataMap, taskQueueMap, callbackStackSet,
  } = (schedulerProcessor.get("getSchedulerQueue") as SchedulerType<S>["getSchedulerQueue"])();

  if ((taskDataMap.size > 0 || callbackStackSet.size > 0) && !schedulerProcessor.get("isUpdating")) {
    // Reduce the generation of redundant microtasks through the isUpdating flag
    schedulerProcessor.set("isUpdating", Promise.resolve().then(() => {
      /**
       * @description Reset the isUpdating and willUpdating flags
       * to ensure that each subsequent round of update batching can proceed and operate normally.
       */
      schedulerProcessor.set("isUpdating", null);
      schedulerProcessor.set("willUpdating", null);

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
        (schedulerProcessor.get("flushTask") as SchedulerType<S>["flushTask"])();

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
    }));
  }
};
