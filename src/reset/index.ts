import type { PrimitiveState, MapType, Callback } from "../types";
import type { StateRestoreAccomplishedMapType, InitialFnCanExecMapType } from "./types";
import type { InitialState, StateRefCounterMapType, ClassThisPointerType } from "../store/types";
import { hasOwnProperty } from "../utils";
import { Scheduler } from "../scheduler/types";

/** clear object */
const clearObject = <S extends PrimitiveState>(object: S) => {
  Object.keys(object).forEach(key => {
    delete object[key];
  });
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
export const mergeStateKeys = <S extends PrimitiveState>(
  reducerState: S,
  stateMap: MapType<S>,
) => Array.from(
    new Set(
      (
        Object.keys(reducerState) as (keyof S)[]
      ).concat(
        Array.from(stateMap.keys())
      )
    )
  );

// Retrieve the reducerState.
export const handleReducerState = <S extends PrimitiveState>(
  reducerState: S,
  initialState?: InitialState<S>,
) => {
  /**
   * @description If the data is in the initialization state and returned by a function,
   * the initialization function must be executed again.
   * This ensures that the retrieved internal initialization data aligns with the function's logic.
   * For example, if the initialization function's return includes time in milliseconds,
   * it is important to re-execute the function to acquire the most up-to-date initialization data.
   * Such caution ensures the precision of data recovery.
   */
  if (typeof initialState === "function") {
    clearObject(reducerState);
    Object.entries(initialState()).forEach(([key, value]) => {
      reducerState[key as keyof S] = value;
    });
  }
};

// Logic of recovery processing
const restoreHandle = <S extends PrimitiveState>(
  reducerState: S,
  stateMap: MapType<S>,
  initialState?: InitialState<S>,
) => {
  handleReducerState(reducerState, initialState);
  mergeStateKeys(reducerState, stateMap).forEach(key => {
    hasOwnProperty.call(reducerState, key)
      ? stateMap.set(key, reducerState[key])
      : stateMap.delete(key);
  });
};

/**
 * By using "storeStateRefCounterMap" and "noClassStateRefHandle",
 * we determine whether the store still has component references.
 * As long as there is at least one component referencing,
 * the data will not be reset since it is currently in use within the business logic and does not constitute a complete unloading.
 * The complete unloading cycle corresponds to the entire usage cycle of the store.
 */
export const unmountRestoreHandle = <S extends PrimitiveState>(
  unmountRestore: boolean,
  reducerState: S,
  stateMap: MapType<S>,
  storeStateRefCounterMap: StateRefCounterMapType,
  stateRestoreAccomplishedMap: StateRestoreAccomplishedMapType,
  initialFnCanExecMap: InitialFnCanExecMapType,
  classThisPointerSet: Set<ClassThisPointerType<S>>,
  initialState?: InitialState<S>,
) => {
  const noRefFlag = !classThisPointerSet.size
    && !storeStateRefCounterMap.get("counter")
    && !stateRestoreAccomplishedMap.get("unmountRestoreAccomplished");
  /**
   * When initialState is a function,
   * it does not have to be executed at unmount time,
   * because initialization time is sure to reset execution,
   * thus optimizing code execution efficiency.
   */
  if (unmountRestore && noRefFlag && typeof initialState !== "function") {
    stateRestoreAccomplishedMap.set("unmountRestoreAccomplished", true);
    restoreHandle(reducerState, stateMap, initialState);
  }
  noRefFlag && initialFnCanExecMap.set("canExec", true);
};

// Retrieve recovery processing when initialState is a function
export const initialStateFnRestoreHandle = <S extends PrimitiveState>(
  reducerState: S,
  stateMap: MapType<S>,
  storeStateRefCounterMap: StateRefCounterMapType,
  stateRestoreAccomplishedMap: StateRestoreAccomplishedMapType,
  initialFnCanExecMap: InitialFnCanExecMapType,
  classThisPointerSet: Set<ClassThisPointerType<S>>,
  initialState?: InitialState<S>,
) => {
  // The relevant judgment logic is similar to unmountRestoreHandle.
  if (
    typeof initialState === "function"
    && initialFnCanExecMap.get("canExec")
    && !classThisPointerSet.size
    && !storeStateRefCounterMap.get("counter")
    && !stateRestoreAccomplishedMap.get("initialStateFnRestoreAccomplished")
  ) {
    stateRestoreAccomplishedMap.set("initialStateFnRestoreAccomplished", true);
    restoreHandle(reducerState, stateMap, initialState);
    initialFnCanExecMap.set("canExec", true);
  }
};

/**
 * @description In order to prevent the double rendering in React's StrictMode
 * from causing issues with the registration function returned in useEffect,
 * it happens to be opportune for storeMap to release memory preemptively
 * during the first unloading execution.
 * (with memory release being performed in the callback).
 * This early release of memory removes the previous storeMapValue,
 * and any subsequent updates or renderings will regenerate a new storeMapValue.
 * However, this process leads to the updater function's singlePropStoreChangeSet
 * within storeMapValue referencing the address of the previously outdated storeMapValue.
 * Meanwhile, that old singlePropStoreChangeSet has already been deleted.
 * and cleared with the early release of the storeMapValue's memory,
 * leading to the updater function's incapability to make valid updates.
 * Here, to ensure operations such as unloading, freeing memory,
 * and unmountRestoreHandle run smoothly,
 * a microtask can be used to postpone the unmount process.
 */
export function deferHandle<S extends PrimitiveState>(
  unmountRestore: boolean,
  reducerState: S,
  stateMap: MapType<S>,
  storeStateRefCounterMap: StateRefCounterMapType,
  stateRestoreAccomplishedMap: StateRestoreAccomplishedMapType,
  schedulerProcessor: MapType<Scheduler<S>>,
  initialFnCanExecMap: InitialFnCanExecMapType,
  classThisPointerSet: Set<ClassThisPointerType<S>>,
  initialState?: InitialState<S>,
  callback?: Callback,
) {
  if (!schedulerProcessor.get("deferDestructorFlag")) {
    schedulerProcessor.set("deferDestructorFlag", Promise.resolve().then(() => {
      schedulerProcessor.set("deferDestructorFlag", null);
      if (!storeStateRefCounterMap.get("counter") && !classThisPointerSet.size) {
        // Turn on the switch to perform refresh recovery data
        stateRestoreAccomplishedMap.set("unmountRestoreAccomplished", null);
        stateRestoreAccomplishedMap.set("initialStateFnRestoreAccomplished", null);
        unmountRestoreHandle(
          unmountRestore, reducerState, stateMap, storeStateRefCounterMap,
          stateRestoreAccomplishedMap, initialFnCanExecMap, classThisPointerSet, initialState,
        );
      }
      callback?.();
    }));
  }
}
