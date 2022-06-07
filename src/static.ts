import ReactDOM from "react-dom";
import { Callback, CustomEventDispatcherInterface, EffectState, ResyType } from "./model";

export function batchUpdateShimRun(fn: Callback) { fn() }

export const batchUpdate = ReactDOM.unstable_batchedUpdates || batchUpdateShimRun;

export const resyAllStoreListenerEventType = "resyAllStoreChangedListenerEventType";

export const dispatchAllStoreEffectSet = new Set<CustomEventDispatcherInterface<any>>();

export function dispatchAllStoreEffect<T extends ResyType>(
  effectData: EffectState<T>,
  preState: T,
  nextState: T,
) {
  dispatchAllStoreEffectSet.forEach(item => item.dispatchEvent(
    resyAllStoreListenerEventType,
    effectData,
    preState,
    nextState,
  ));
}

export const storeListenerKey = "resyStoreListenerSymbolKey";
