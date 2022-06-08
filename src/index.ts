import useSyncExternalStoreExports from "use-sync-external-store/shim";
import { dispatchAllStoreEffect, storeListenerKey } from "./static";
import { Callback, State, Store, EffectState, CustomEventDispatcherInterface } from "./model";

const { useSyncExternalStore } = useSyncExternalStoreExports;

export function resy<T extends State>(state: T, unmountClear: boolean = true): T {
  
  const storeListener = {
    listenerEventType: Symbol("storeListenerSymbol"),
    dispatchStoreEffectSet: new Set<CustomEventDispatcherInterface<any>>(),
    dispatchStoreEffect: <T extends State>(effectData: EffectState<T>, preState: T, nextState: T) => {
      storeListener.dispatchStoreEffectSet.forEach(item => item.dispatchEvent(
        storeListener.listenerEventType,
        effectData,
        preState,
        nextState,
      ));
    },
  }
  
  const store: Store<T> = {} as Store<T>;
  
  let stateTemp: T = Object.assign({}, state);
  
  function genStoreItem(key: keyof T) {
    const storeChanges = new Set<Callback>();
    store[key] = {
      subscribe: (storeChange) => {
        storeChanges.add(storeChange);
        return () => {
          storeChanges.delete(storeChange);
          if (unmountClear) {
            unmountClear = false;
            const timeId = setTimeout(() => {
              unmountClear = true;
              stateTemp = Object.assign({}, state);
              clearTimeout(timeId);
            }, 0);
          }
        };
      },
      getString: () => stateTemp[key],
      setString: (val) => {
        const preState = Object.assign({}, stateTemp);
        if (Object.is(val, stateTemp[key]) || typeof val === "function") return;
        stateTemp[key] = val;
        const nextState = Object.assign({}, stateTemp);
        storeChanges.forEach(storeChange => storeChange());
        const effectState = { [key]: val } as EffectState<T>;
        dispatchAllStoreEffect<T>(effectState, preState, nextState);
        storeListener.dispatchStoreEffect<T>(effectState, preState, nextState);
      },
      useString: () => useSyncExternalStore(
        store[key].subscribe,
        store[key].getString,
      ),
    };
  }
  
  function resolveInitialValueLinkStore(key: keyof T, val?: any) {
    if (store[key] === void 0 && typeof val !== "function") {
      genStoreItem(key);
      return store[key];
    }
    if (!stateTemp[key] && store[key] === void 0 && typeof val === "function") {
      stateTemp[key] = val;
    }
    return store[key];
  }
  
  return new Proxy(state, {
    get: (_, key: keyof T) => {
      if (key === storeListenerKey) {
        return storeListener;
      }
      try {
        return resolveInitialValueLinkStore(key).useString();
      } catch (e) {
        return stateTemp[key];
      }
    },
    set: (_, key: keyof T, val: T[keyof T]) => {
      resolveInitialValueLinkStore(key, val)?.setString(val);
      return true;
    },
  } as ProxyHandler<T>);
}

export * from "./api";
