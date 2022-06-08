import { resy } from "./index";

export type Callback = () => void;

export type State = Record<string, any>;

export type Store<T> = {
  [K in keyof T]: {
    subscribe: (onStoreChange: Callback) => Callback;
    getString: () => T[K];
    setString: (val: T[K]) => void;
    useString: () => T[K];
  };
};

export type ResyType = ReturnType<typeof resy>;

export type EffectState<T extends ResyType> = {
  [K in keyof T]: any;
}

export type ListenerHandle<T extends ResyType> = (
  effectState: EffectState<T>,
  prevState: T,
  nextState: T,
) => void;

export interface CustomEventDispatcherInterface<T extends ResyType> {
  addEventListener<T>(type: string | symbol, handle: ListenerHandle<T>): void,
  dispatchEvent(
    type: string | symbol,
    effectState: EffectState<T>,
    prevState: T,
    nextState: T,
  ): void,
  removeEventListener(type: string | symbol): void,
}

export type StoreListener = {
  listenerEventType: string | symbol;
  dispatchStoreEffectSet: Set<CustomEventDispatcherInterface<any>>;
  dispatchStoreEffect: <T extends State>(effectData: EffectState<T>) => void,
};
