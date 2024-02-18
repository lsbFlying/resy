import type { Callback, ValueOf, PrimitiveState, MapType } from "../types";
import type { Subscribe } from "../subscribe/types";
import type {
  ClassConnectStoreType, ClassUnmountHandleType, ClassStateRefSetType,
  ClassFnInitialHandleType, ClassThisPointerStoresType,
} from "../classConnect/types";
import { __REGENERATIVE_SYSTEM_KEY__, __USE_STORE_KEY__ } from "./static";
import { Listener } from "../subscribe/types";

/**
 * @description The second parameter configuration item of createStore
 */
export type StoreOptions = Readonly<{
  /**
   * @description Whether to reset and restore the data to its initial state
   * when all modules used by the current page are unmount.
   * In the case of global data such as login information or themes,
   * it would be set to false, so that the resulting loginStore or themeStore can take effect globally across the system.
   * @default true
   */
  unmountRestore?: boolean;
  /**
   * Configuration for useConciseState hooks (internal, not recommended externally)
   * @default undefined
   */
  __useConciseStateMode__?: boolean;
}>;

/** Type of key disabled in the initialization parameters */
export type InitialStateForbiddenKeys =
  | "setState"
  | "syncUpdate"
  | "subscribe"
  | "restore"
  | "setOptions"
  | "useStore"
  | "store";

/**
 * @description Type of storeMapValue
 */
export type StoreMapValueType<S extends PrimitiveState> = {
  // The current source data state change event subscription callback, which is useSyncExternalStore's subscribe
  subscribeOriginState: (onOriginStateChange: Callback) => Callback;
  // Get the current source data (individual data attribute status)
  getOriginState: () => ValueOf<S>;
  /**
   * @description Using the current source data,
   * namely the useSnapshot from useSyncExternalStore,
   * can be simply understood as having the effect of useState,
   * possessing the ability to drive page updates and rendering.
   */
  useOriginState: () => ValueOf<S>;
  // An updater for updating source data
  updater: Callback;
};

export type StoreMapValue<S extends PrimitiveState> = MapType<StoreMapValueType<S>>;
// Type of storeMap
export type StoreMap<S extends PrimitiveState> = Map<keyof S, StoreMapValue<S>>;

// Some additional extensions of tool classes and property sets of methods needed within store
export type ExternalMapValue<S extends PrimitiveState> = StoreUtils<S>
  & ClassConnectStoreType
  & ClassUnmountHandleType
  & ClassFnInitialHandleType
  & {
  [__REGENERATIVE_SYSTEM_KEY__]: symbol;
  [__USE_STORE_KEY__]: object;
  readonly store: Store<S>;
};

// Type of externalMap
export type ExternalMapType<S extends PrimitiveState> = MapType<ExternalMapValue<S>>;

/** Update the data type of the parameter */
export type State<S extends PrimitiveState> = Partial<S> | S | null;

/**
 * This object type of class
 * @description The this here refers to the subclass object that inherits ComponentWithStore or PureComponentWithStore.
 */
export type ClassThisPointerType<S extends PrimitiveState> = PrimitiveState
  & Readonly<{ setState(state: State<S>): void }>
  & ClassConnectStoreType
  & ClassThisPointerStoresType
  & ClassStateRefSetType<S>
  & {
  updater: {
    isMounted(classItem: any): boolean;
  };
};

/** Type of setState */
export type SetState<S extends PrimitiveState> = Readonly<{
  /**
   * @param state
   * @param callback
   */
  setState(
    state: State<S> | StateFnType<S>,
    callback?: StateCallback<S>,
  ): void;
}>;

/**
 * The type of update parameter is function parameter
 * @description The presence of prevState is necessary.
 * In complex business updating logic and event loops,
 * being able to directly obtain the previous synchronized state
 * through simple synchronous code is a very smooth and simple method.
 */
export type StateFnType<S extends PrimitiveState> = (prevState: Readonly<S>) => State<S>;

/**
 * Type of callback functions for setState, syncUpdate, and restore
 * @description The existence of the nextState parameter in the callback is also necessary for reasons similar to prevState.
 */
export type StateCallback<S extends PrimitiveState> = (nextState: Readonly<S>) => void;

// Element types of setState, syncUpdate, restore callback execution stack
export type StateCallbackItem<S extends PrimitiveState> = {
  nextState: S;
  callback: StateCallback<S>;
};

/** Type of syncUpdate */
export type SyncUpdate<S extends PrimitiveState> = Readonly<{
  /**
   * @param state
   * @param callback
   */
  syncUpdate(
    state: State<S> | StateFnType<S>,
    callback?: StateCallback<S>,
  ): void;
}>;

/** Type of restore */
export type Restore<S extends PrimitiveState> = Readonly<{
  /**
   * @param callback
   */
  restore(callback?: StateCallback<S>): void;
}>;

/**
 * Type of setOptions
 * @description The reason why changing StoreOptions is permissible is due to the needs of business scenarios
 * and the desire to keep development channels open and flexible.
 * This is because the static execution of createStore is by itself a limitation.
 * If there is a need for sudden changes in certain scenarios
 * and the static parameter settings cannot be made changeable at that time,
 * it would be a constraint. The existence of setOptions can lift this static restriction,
 * and setOptions should be considered an aid. However, generally speaking,
 * the configuration of StoreOptions itself should meet and satisfy the vast majority of usage scenarios,
 * so the occurrences where setOptions is needed are still relatively rare.
 */
export type SetOptions = Readonly<{
  setOptions(options: Pick<StoreOptions, "unmountRestore">): void;
}>;

/** store.useStore() */
export type UseStore<S extends PrimitiveState> = Readonly<{
  useStore(): S & StoreCoreUtils<S> & SetOptions;
}>;

/** store.useSubscribe() */
export type UseSubscribe<S extends PrimitiveState> = Readonly<{
  useSubscribe(listener: Listener<S>, stateKeys?: (keyof S)[]): void;
}>;

/** Some of the core tool method types of store */
export type StoreCoreUtils<S extends PrimitiveState> = SetState<S> & SyncUpdate<S> & Restore<S> & Subscribe<S>;

/** Tool method type of store */
export type StoreUtils<S extends PrimitiveState> = StoreCoreUtils<S> & SetOptions & UseStore<S> & UseSubscribe<S>;

/** The type of store returned by createStore */
export type Store<S extends PrimitiveState> = S & StoreUtils<S>;

/** The thisType type used to initialize store when initialState is a function */
export type InitialStore<S extends PrimitiveState> = {
  [K in keyof S]: K extends InitialStateForbiddenKeys ? never : S[K];
} & StoreCoreUtils<S> & SetOptions;

/** Parameter types disabled for initialization of InitialState */
export type PrimateForbiddenType =
  | number
  | string
  | null
  | Symbol
  | boolean
  | Set<any>
  | Map<any, any>
  | Array<any>
  | WeakSet<any>
  | WeakMap<any, any>
  | WeakRef<any>
  | RegExp
  | BigInt
  | Date
  | Window;

/** Parameter types with this type pointing to identification */
export type StateWithThisType<S extends PrimitiveState> = S extends PrimateForbiddenType
  ? never
  : S & {
    [K in keyof S]: K extends InitialStateForbiddenKeys
      ? never
      : S[K];
  } & ThisType<InitialStore<S>>;

/** Type of initialize data */
export type InitialState<S extends PrimitiveState> = (() => StateWithThisType<S>) | StateWithThisType<S>;

// Type of counter for store
export type StateRefCounterMapType = MapType<{
  counter: number;
}>;
