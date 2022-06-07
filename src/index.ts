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
  
  const defaultState: T = {} as T;
  
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
              Object.keys(store).forEach((key: keyof T) => {
                state[key] = defaultState[key];
              });
              clearTimeout(timeId);
            }, 0);
          }
        };
      },
      getString: () => state[key],
      setString: (val) => {
        const preState = Object.assign({}, state);
        if (Object.is(val, state[key]) || typeof val === "function") return;
        state[key] = val;
        const nextState = Object.assign({}, state);
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
  
  Object.keys(state).forEach((key: keyof T) => {
    defaultState[key] = state[key];
    if (typeof state[key] === "function") return;
    genStoreItem(key);
  });
  
  function resolveInitValueUndefined(key: keyof T, val?: any) {
    if (store[key] === void 0 && typeof val !== "function") {
      genStoreItem(key);
      return store[key];
    }
    if (!state[key] && store[key] === void 0 && typeof val === "function") {
      state[key] = val;
    }
    return store[key];
  }
  
  return new Proxy(state, {
    get: (_, key: keyof T) => {
      if (key === storeListenerKey) {
        return storeListener;
      }
      try {
        return resolveInitValueUndefined(key).useString();
      } catch (e) {
        return state[key];
      }
    },
    set: (_, key: keyof T, val: T[keyof T]) => {
      resolveInitValueUndefined(key, val)?.setString(val);
      return true;
    },
  } as ProxyHandler<T>);
}

export * from "./api";
