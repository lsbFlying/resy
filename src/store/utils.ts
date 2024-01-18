import type { PrimitiveState, ValueOf, MapType, Callback } from "../types";
import type {
  StateCallbackItem, StoreMapValue, StoreMapValueType, StoreMap,
  InitialState, StateRefCounterMapType, State, ClassThisPointerType,
} from "./types";
import type { Scheduler } from "../scheduler/types";
import type { Listener } from "../subscribe/types";
import type { StateRestoreAccomplishedMapType, InitialFnCanExecMapType } from "../reset/types";
import useSyncExternalStoreExports from "use-sync-external-store/shim";
import { initialStateFnRestoreHandle, deferHandle } from "../reset";
import { batchUpdate } from "./static";

/**
 * @description Additional references are utilized to ensure the compatibility
 * of the package in ESM since 'use-sync-external-store' only exports in CJS format.
 */
const { useSyncExternalStore } = useSyncExternalStoreExports;

/** Track the shallow-cloned state map */
const shallowCloneMap = <K, V>(map: Map<K, V>) => {
  const mapTemp: Map<K, V> = new Map();
  map.forEach((value, key) => {
    mapTemp.set(key, value);
  });
  return mapTemp;
};

/** map to object */
export const mapToObject = <S extends PrimitiveState>(map: MapType<S>): S => {
  const object = {} as S;
  for (const [key, value] of map) {
    object[key] = value;
  }
  return object;
};

/** object to map */
export const objectToMap = <S extends PrimitiveState>(object: S) => Object.keys(object)
  .reduce((prev, key) => {
    prev.set(key, object[key]);
    return prev;
  }, new Map());

/**
 * @description By connecting the core mapping variable storeMap within the store,
 * a series of operations such as tagging, subscribing, updating, tracking, and rendering are completed.
 */
export const connectStore = <S extends PrimitiveState>(
  key: keyof S,
  unmountRestore: boolean,
  reducerState: S,
  stateMap: MapType<S>,
  storeStateRefCounterMap: StateRefCounterMapType,
  storeMap: StoreMap<S>,
  stateRestoreAccomplishedMap: StateRestoreAccomplishedMapType,
  schedulerProcessor: MapType<Scheduler<S>>,
  initialFnCanExecMap: InitialFnCanExecMapType,
  classThisPointerSet: Set<ClassThisPointerType<S>>,
  initialState?: InitialState<S>,
) => {
  // Resolve the problem that the initialization attribute may be undefined
  if (storeMap.has(key)) return storeMap;

  const storeMapValue: StoreMapValue<S> = new Map();
  // The Set memory of the update function of a single attribute
  const singlePropStoreChangeSet = new Set<Callback>();

  storeMapValue.set("subscribeOriginState", (onOriginStateChange: Callback) => {
    // If a component references the data, the update function will be added to singlePropStoreChangeSet
    singlePropStoreChangeSet.add(onOriginStateChange);

    // Increment the reference count by 1 if the component is referenced
    storeStateRefCounterMap.set("counter", storeStateRefCounterMap.get("counter")! + 1);

    return () => {
      singlePropStoreChangeSet.delete(onOriginStateChange);
      storeStateRefCounterMap.set("counter", storeStateRefCounterMap.get("counter")! - 1);

      deferHandle(
        unmountRestore, reducerState, stateMap, storeStateRefCounterMap,
        stateRestoreAccomplishedMap, schedulerProcessor, initialFnCanExecMap,
        classThisPointerSet, initialState, () => {
          // Release memory if there are no component references
          if (!singlePropStoreChangeSet.size) storeMap.delete(key);
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
    singlePropStoreChangeSet.forEach(storeChange => {
      storeChange();
    });
  });

  storeMap.set(key, storeMapValue);

  return storeMap;
};

/**
 * @description It is essentially a call to useSyncExternalStore,
 * concatenating a series of operations through the core storeMap generated in connectStore.
 */
export const connectHookUse = <S extends PrimitiveState>(
  key: keyof S,
  unmountRestore: boolean,
  reducerState: S,
  stateMap: MapType<S>,
  storeStateRefCounterMap: StateRefCounterMapType,
  storeMap: StoreMap<S>,
  stateRestoreAccomplishedMap: StateRestoreAccomplishedMapType,
  schedulerProcessor: MapType<Scheduler<S>>,
  initialFnCanExecMap: InitialFnCanExecMapType,
  classThisPointerSet: Set<ClassThisPointerType<S>>,
  initialState?: InitialState<S>,
) => {
  // Perform refresh recovery logic if initialState is a function
  initialStateFnRestoreHandle(
    reducerState, stateMap, storeStateRefCounterMap, stateRestoreAccomplishedMap,
    initialFnCanExecMap, classThisPointerSet, initialState,
  );
  return (
    connectStore(
      key, unmountRestore, reducerState, stateMap,
      storeStateRefCounterMap, storeMap, stateRestoreAccomplishedMap,
      schedulerProcessor, initialFnCanExecMap, classThisPointerSet, initialState,
    ).get(key)!.get("useOriginState") as StoreMapValueType<S>["useOriginState"]
  )();
};

// State updates for class components
export const classUpdater = <S extends PrimitiveState>(
  key: keyof S,
  value: ValueOf<S>,
  classThisPointerSet: Set<ClassThisPointerType<S>>,
) => {
  classThisPointerSet?.forEach(classThisPointerItem => {
    /**
     * There is an "updater" attribute on the internal this pointer of react's class,
     * and an "isMounted" method is mounted on it to determine whether the component has been loaded.
     * If it is in "React.StrictMode" mode,
     * React will discard the first generated instance and the instance will not be mounted.
     */
    if (classThisPointerItem.updater.isMounted(classThisPointerItem)) {
      classThisPointerItem?.setState({ [key]: value } as State<S>);
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
  schedulerProcessor: MapType<Scheduler<S>>,
  unmountRestore: boolean,
  reducerState: S,
  storeStateRefCounterMap: StateRefCounterMapType,
  storeMap: StoreMap<S>,
  stateRestoreAccomplishedMap: StateRestoreAccomplishedMapType,
  initialFnCanExecMap: InitialFnCanExecMapType,
  classThisPointerSet: Set<ClassThisPointerType<S>>,
  initialState?: InitialState<S>,
  isDelete?: boolean,
) => {
  if (!Object.is(value, stateMap.get(key))) {
    // The pre-execution of the data changes accumulates the logic of the correct execution of the final update,
    // which lays the foundation for subsequent batch updates.
    !isDelete ? stateMap.set(key, value) : stateMap.delete(key);

    (schedulerProcessor.get("pushTask") as Scheduler<S>["pushTask"])(
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
            key, unmountRestore, reducerState, stateMap,
            storeStateRefCounterMap, storeMap, stateRestoreAccomplishedMap,
            schedulerProcessor, initialFnCanExecMap, classThisPointerSet, initialState,
          ).get(key)!.get("updater") as StoreMapValueType<S>["updater"]
        )();
      },
    );
  }
};

/**
 * @description Final batch update processing
 * With the help of the micro-task event loop via 'then',
 * the update execution of data and tasks are placed onto the stack, and subsequently flushed.
 */
export const finallyBatchHandle = <S extends PrimitiveState>(
  schedulerProcessor: MapType<Scheduler<S>>,
  prevBatchState: MapType<S>,
  stateMap: MapType<S>,
  listenerSet: Set<Listener<S>>,
  stateCallbackStackSet: Set<StateCallbackItem<S>>,
) => {
  const {
    taskDataMap, taskQueueSet,
  } = (schedulerProcessor.get("getTasks") as Scheduler<S>["getTasks"])();

  if (taskDataMap.size > 0 && !schedulerProcessor.get("isUpdating")) {
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
          taskQueueSet.forEach(task => {
            task();
          });
        }

        // Make a shallow clone of the "taskDataMap" data for the "effectState" of "subscribe",
        // because the task data will then be washed away.
        const effectStateTemp = listenerSet.size > 0 ?? shallowCloneMap(taskDataMap);

        /**
         * @description With this, the task of this round of data updates is complete.
         * The task data and task queue are immediately flushed and cleared,
         * freeing up space in preparation for the next round of data updates.
         */
        (schedulerProcessor.get("flush") as Scheduler<S>["flush"])();

        // 🌟 The execution of subscribe and callback needs to be placed after flush,
        // otherwise their own update queues will be emptied in advance, affecting their own internal execution.

        // Updates within subscriptions are processed in batch to reduce the excess burden of updates.
        if (listenerSet.size > 0) {
          listenerSet.forEach(item => {
            // the clone returned by mapToObject ensures that the externally subscribed data
            // maintains it`s purity and security as much as possible in terms of usage.
            item({
              effectState: mapToObject(effectStateTemp as any as MapType<S>),
              nextState: mapToObject(stateMap),
              prevState: mapToObject(prevBatchState),
            });
          });
        }

        // At the same time, it also takes the opportunity to batch process the updates in the callback stack.
        if (stateCallbackStackSet.size > 0) {
          stateCallbackStackSet.forEach(({ callback, nextState }) => {
            callback(nextState);
          });
          stateCallbackStackSet.clear();
        }
      });
    }));
  }
};
