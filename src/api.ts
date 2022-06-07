import { useMemo } from "react";
import {
  Callback, ResyType, ListenerHandle, CustomEventDispatcherInterface, StoreListener, EffectState,
} from "./model";
import { batchUpdate, resyAllStoreListenerEventType, dispatchAllStoreEffectSet, storeListenerKey } from "./static";
import { EventDispatcher } from "./listener";

export function resyUpdate<T extends ResyType>(store: T | Callback, state: Partial<T> | T = {}) {
  if (typeof store === "function") {
    batchUpdate(store as Callback);
    return;
  }
  batchUpdate(() => {
    Object.keys(state).forEach(key => {
      (store as any)[key] = (state as Partial<T> | T)[key];
    });
  });
}

export function resyMemo<Sto extends ResyType, Res>(
  factory: (deconstructedStore: Sto) => Res,
  store: Sto,
  deps?: ReadonlyArray<any>,
) {
  const dStore = Object.assign({}, store) as Sto;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useMemo(factory.bind(null, dStore), !deps ? undefined : deps);
}

export function resyListener<T extends ResyType>(
  listener: ListenerHandle<T>,
  store?: T,
  listenerKey?: keyof T,
) {
  const resyListenerHandle = (): Callback => {
    const resyListenerEventType = store && typeof store === "object"
      ? (store[storeListenerKey] as StoreListener).listenerEventType
      : resyAllStoreListenerEventType;
    
    const dispatchStoreEffectSet = store && typeof store === "object"
      ? (store[storeListenerKey] as StoreListener).dispatchStoreEffectSet
      : dispatchAllStoreEffectSet;
    
    const listenerOrigin = (effectState: EffectState<T>, prevState: T, nextState: T) => {
      let includesFlag = true;
      if (listenerKey) {
        const effectStateFields = Object.keys(effectState);
        if (listenerKey !== effectStateFields[0]) {
          includesFlag = false;
        }
      }
      if (!listenerKey || (listenerKey && includesFlag)) {
        listener(effectState, prevState, nextState);
      }
    }
    
    const customEventDispatcher: CustomEventDispatcherInterface<T> = new (EventDispatcher as any)();
    customEventDispatcher.addEventListener(resyListenerEventType, listenerOrigin);
    dispatchStoreEffectSet.add(customEventDispatcher);
    
    return () => {
      dispatchStoreEffectSet.forEach(item => {
        if (item === customEventDispatcher) item.removeEventListener(resyListenerEventType)
      });
      dispatchStoreEffectSet.delete(customEventDispatcher);
    };
  };
  return resyListenerHandle();
}
