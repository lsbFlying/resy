import type { Callback, ValueOf, PrimitiveState, MapType } from "../types";
import type { Subscribe, ListenerType } from "../subscribe/types";
import type {
  ClassConnectStoreType, ClassUnmountProcessingType, ClassInitialStateRetrieveType,
} from "../classConnect/types";
import type { SignalsType } from "../signal/types";
import {
  __REGENERATIVE_SYSTEM_KEY__, __STATE_REF_COUNTER_KEY__,
  __STORE_NAMESPACE__, __USE_STORE_KEY__,
} from "./static";

/**
 * @description The second parameter configuration item of createStore
 */
export interface StoreOptions {
  /**
   * @description Whether to reset and restore the data to its initial state
   * when all modules used by the current page are unmount.
   * In the case of global data such as login information or themes,
   * it would be set to false,
   * so that the resulting loginStore or themeStore can take effect globally across the system.
   * @default true
   */
  readonly unmountRestore?: boolean;
  /**
   * @description The abstract name or namespace of the store,
   * when it is difficult to distinguish the states of the same key by mixing stores in a complex module,
   * which helps identify specific stores and facilitates finding component elements during debugging.
   */
  readonly namespace?: string;
}

export interface InnerStoreOptions extends StoreOptions {
  /**
   * @description Configuration for useConciseState hooks (Internal use, do not use externally)
   * @default undefined
   */
  readonly __useConciseState__?: boolean;
  /**
   * @description Configuration for createSignals api (Internal use, do not use externally)
   * @default "state"
   */
  readonly __mode__?: ModeType;
}

export type ModeType = "signal" | "state";

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

/** Some of the core tool method types of store */
export type StoreCoreUtils<S extends PrimitiveState> = Readonly<
  & SetState<S>
  & SyncUpdate<S>
  & Restore<S>
  & Subscribe<S>
>;

export type StoreHookUtils<S extends PrimitiveState> = Readonly<
  & UseStore<S>
  & UseSubscription<S>
>;

/** Tool method type of store */
export type StoreUtils<S extends PrimitiveState> = StoreCoreUtils<S> & StoreHookUtils<S> & Readonly<SetOptions>;

/** The type of store returned by createStore */
export type Store<S extends PrimitiveState> = S & StoreUtils<S>;

export type ConciseStoreCore<S extends PrimitiveState> = S & StoreCoreUtils<S> & StoreHookUtils<S>;

export interface ConciseStoreHeart<S extends PrimitiveState> {
  readonly store: ConciseStoreCore<S>;
}

/** Return type of useConciseState */
export type ConciseStore<S extends PrimitiveState> = S & StoreCoreUtils<S> & ConciseStoreHeart<S>;

export type StoreMapValue<S extends PrimitiveState> = MapType<StoreMapValueType<S>>;
// Type of storeMap
export type StoreMap<S extends PrimitiveState> = Map<keyof S, StoreMapValue<S>>;

// Some additional extensions of tool classes and property sets of methods needed within store
export type ExternalMapValue<S extends PrimitiveState> = StoreUtils<S>
  & ClassConnectStoreType
  & ClassUnmountProcessingType
  & ClassInitialStateRetrieveType
  & SignalsType<S>
  & {
  [__REGENERATIVE_SYSTEM_KEY__]: symbol;
  [__USE_STORE_KEY__]: object;
  [__STATE_REF_COUNTER_KEY__]: StateRefCounterMapType;
  [__STORE_NAMESPACE__]?: string;
  readonly store: Store<S>;
};

// Type of externalMap
export type ExternalMapType<S extends PrimitiveState> = MapType<ExternalMapValue<S>>;

/** Update the data type of the parameter */
export type State<S extends PrimitiveState> = Partial<S> | S | null;

/**
 * The type of update parameter is function parameter
 * @description The presence of prevState is necessary.
 * In complex business updating logic and event loops,
 * being able to directly obtain the previous synchronized state
 * through simple synchronous code is a very smooth and simple method.
 */
export type StateFnType<S extends PrimitiveState> = (prevState: Readonly<S>) => State<S>;

export type SetStateAction<S extends PrimitiveState> = State<S> | StateFnType<S>;

/** Type of setState */
export interface SetState<S extends PrimitiveState> {
  /**
   * @param state
   * @param callback
   */
  setState(
    state: SetStateAction<S>,
    callback?: StateCallback<S>,
  ): void;
}

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
export interface SyncUpdate<S extends PrimitiveState> {
  /**
   * @param state
   * @param callback
   */
  syncUpdate(
    state: SetStateAction<S>,
    callback?: StateCallback<S>,
  ): void;
}

/** Type of restore */
export interface Restore<S extends PrimitiveState> {
  /**
   * @param callback
   * @description The reason for not naming it reset is due to
   * the consideration of scenarios where the createStore parameter might be a function.
   * In such cases, logically speaking, it's not so much about resetting but rather about restoring.
   * As for what state it restores to depends on the result returned by the execution of the initialization function.
   * Hence, the choice of the name restore instead of reset.
   */
  restore(callback?: StateCallback<S>): void;
}

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
export interface SetOptions {
  setOptions(options: Readonly<{ unmountRestore: boolean }>): void;
}

/** store.useStore() */
export interface UseStore<S extends PrimitiveState> {
  useStore(): Store<S>;
}

/**
 * store.UseSubscription()
 * @description It`s advantage is that you only need to consider the data you want to subscribe to,
 * rather than the psychological burden to consider whether the data reference inside the function can get the latest value.
 * UseSubscription will reduce your mental burden and allow you to use it normally.
 */
export interface UseSubscription<S extends PrimitiveState> {
  useSubscription(listener: ListenerType<S>, stateKeys?: (keyof S)[]): void;
}

/** Type of key disabled in the initialization parameters */
export type InitialStateForbiddenKeys = keyof StoreUtils<PrimitiveState> | "store" | "signals";

/** thisType type used to initialize store when initialState is a function */
export type InitialStore<S extends PrimitiveState> = {
  [K in keyof S]: K extends InitialStateForbiddenKeys ? never : S[K];
} & Store<S>;

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
  | Date;

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
