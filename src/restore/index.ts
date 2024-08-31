import type { PrimitiveState, MapType, Callback } from "../types";
import type { InitialFnCanExecMapType } from "./types";
import type { InitialState, StateRefCounterMapType, StoreOptions } from "../store/types";
import type { SignalMetaMapType } from "../signal/types";
import type { SchedulerType } from "../scheduler/types";
import type { ClassInstanceTypeOfConnectStore } from "../classConnect/types";
import { hasOwnProperty } from "../utils";
import { clearObject } from "./utils";

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
) => {
  return Array.from(
    new Set(
      (
        Object.keys(reducerState) as (keyof S)[]
      ).concat(
        Array.from(stateMap.keys())
      )
    )
  );
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
export const retrieveReducerState = <S extends PrimitiveState>(
  reducerState: S,
  initialState?: InitialState<S>,
) => {
  if (typeof initialState === "function") {
    clearObject(reducerState);
    Object.entries(initialState()).forEach(([key, value]) => {
      reducerState[key as keyof S] = value;
    });
  }
};

// Logic of recovery processing
const restoreProcessing = <S extends PrimitiveState>(
  reducerState: S,
  stateMap: MapType<S>,
  signalMetaMap: SignalMetaMapType<S>,
  initialState?: InitialState<S>,
) => {
  retrieveReducerState(reducerState, initialState);
  mergeStateKeys(reducerState, stateMap).forEach(key => {
    hasOwnProperty.call(reducerState, key)
      ? stateMap.set(key, reducerState[key])
      : stateMap.delete(key);
  });
  signalMetaMap.clear();
};

/**
 * By using "storeStateRefCounterMap" and "classThisPointerSet",
 * we determine whether the store still has component references.
 * As long as there is at least one component referencing,
 * the data will not be reset since it is currently in use within the business logic and does not constitute a complete unmount.
 * The complete unmount cycle corresponds to the entire usage cycle of the store.
 */
const unmountRestore = <S extends PrimitiveState>(
  options: StoreOptions,
  reducerState: S,
  stateMap: MapType<S>,
  storeStateRefCounterMap: StateRefCounterMapType,
  initialFnCanExecMap: InitialFnCanExecMapType,
  classThisPointerSet: Set<ClassInstanceTypeOfConnectStore<S>>,
  signalMetaMap: SignalMetaMapType<S>,
  initialState?: InitialState<S>,
) => {
  const noRefFlag = !classThisPointerSet.size
    && !storeStateRefCounterMap.get("counter");
  /**
   * When initialState is a function,
   * it does not have to be executed at unmount time,
   * because initialization time is sure to reset execution,
   * thus optimizing code execution efficiency.
   */
  if (options.unmountRestore && noRefFlag && typeof initialState !== "function") {
    restoreProcessing(reducerState, stateMap, signalMetaMap, initialState);
  }
  if (typeof initialState === "function" && noRefFlag) {
    initialFnCanExecMap.set("canExec", true);
  }
};

// Retrieve recovery processing when initialState is a function
export const initialStateRetrieve = <S extends PrimitiveState>(
  reducerState: S,
  stateMap: MapType<S>,
  initialFnCanExecMap: InitialFnCanExecMapType,
  signalMetaMap: SignalMetaMapType<S>,
  initialState?: InitialState<S>,
) => {
  // The relevant judgment logic is similar to unmountRestore.
  if (initialFnCanExecMap.get("canExec")) {
    initialFnCanExecMap.set("canExec", null);
    restoreProcessing(reducerState, stateMap, signalMetaMap, initialState);
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
export function deferRestoreProcessing<S extends PrimitiveState>(
  options: StoreOptions,
  reducerState: S,
  stateMap: MapType<S>,
  storeStateRefCounterMap: StateRefCounterMapType,
  schedulerProcessor: MapType<SchedulerType<S>>,
  initialFnCanExecMap: InitialFnCanExecMapType,
  classThisPointerSet: Set<ClassInstanceTypeOfConnectStore<S>>,
  signalMetaMap: SignalMetaMapType<S>,
  initialState?: InitialState<S>,
  callback?: Callback,
) {
  if (!schedulerProcessor.get("deferEffectDestructorExecFlag")) {
    schedulerProcessor.set("deferEffectDestructorExecFlag", Promise.resolve().then(() => {
      schedulerProcessor.set("deferEffectDestructorExecFlag", null);
      if (!storeStateRefCounterMap.get("counter") && !classThisPointerSet.size) {
        unmountRestore(
          options, reducerState, stateMap, storeStateRefCounterMap,
          initialFnCanExecMap, classThisPointerSet, signalMetaMap, initialState,
        );
      }
      callback?.();
    }));
  }
}
