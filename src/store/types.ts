import type { Callback, ValueOf, PrimitiveState, MapType, AnyFn } from "../types";
import type { ListenerType, SubscribeType } from "../subscribe/types";
import type {
  ClassConnectStoreType, ClassUnmountProcessingType, ClassInitialStateRetrieveType,
} from "../classConnect/types";
import {
  __REGENERATIVE_SYSTEM_KEY__, __STORE_NAMESPACE__, __USE_STORE_KEY__,
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
   * @default undefined
   */
  readonly namespace?: string;
  /**
   * @description 不可
   * @default undefined
   */
  readonly immutable?: boolean;
  /**
   * @description For the configuration options of defineStore,
   * the function properties of defineStore can possess the capability to update and render state data.
   * This configuration is not commonly used;
   * it aims to maintain a certain level of openness and flexibility in its application.
   * @default undefined
   */
  readonly enableMarcoActionStateful?: boolean;
}

export interface InnerStoreOptions extends StoreOptions {
  /**
   * @description Configuration for useConciseState hooks (Internal use, do not use externally)
   * @default undefined
   */
  readonly __useConciseState__?: boolean;
  /**
   * @description This feature is designed to be used with the defineStore function.
   * It enables and optimizes various usage scenarios for stores defined using the defineStore macro.
   * @default undefined
   */
  readonly __enableMacros__?: boolean;
  /**
   * @description Call name of function, used for internal processing of error message prompts.
   * @default "createStore"
   */
  readonly __functionName__?: string;
}

/**
 * @description Type of storeMapValue
 */
export type StoreMapValueType<S extends PrimitiveState> = {
  // The current source data state change event subscription callback, which is useSyncExternalStore's subscribe
  subscribe: (onStoreChange: Callback) => Callback;
  // Get the current source data (individual data attribute status)
  getSnapshot: () => ValueOf<S>;
  /**
   * @description Using the current source data,
   * can be simply understood as having the effect of useState,
   * possessing the ability to drive page updates and rendering.
   */
  useSyncExternalStore: () => ValueOf<S>;
  // An updater for updating source data
  updater: Callback;
};

/** Some of the core tool method types of store */
export type StoreCoreUtils<S extends PrimitiveState> = Readonly<
  & SetStateType<S>
  & SyncUpdateType<S>
  & RestoreType<S>
  & SubscribeType<S>
>;

export type StoreHookUtils<S extends PrimitiveState> = Readonly<
  & UseStoreType<S>
  & UseSubscriptionType<S>
>;

/** Tool method type of store */
export type StoreUtils<S extends PrimitiveState> =
  StoreCoreUtils<S>
  & StoreHookUtils<S>
  & Readonly<SetOptionsType>
  & Readonly<GetOptionsType>;

/** The type of store returned by createStore */
export type Store<S extends PrimitiveState> = S & StoreUtils<S>;

export interface StoreType<S extends PrimitiveState> {
  readonly store: Store<S>;
}

export type StoreMapValue<S extends PrimitiveState> = MapType<StoreMapValueType<S>>;
// Type of storeMap
export type StoreMap<S extends PrimitiveState> = Map<keyof S, StoreMapValue<S>>;

// Some additional extensions of tool classes and property sets of methods needed within store
export type ExternalMapValue<S extends PrimitiveState> = StoreUtils<S>
  & ClassConnectStoreType
  & ClassUnmountProcessingType
  & ClassInitialStateRetrieveType
  & {
  [__REGENERATIVE_SYSTEM_KEY__]: symbol;
  [__USE_STORE_KEY__]: object;
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
export type SetStateType<S extends PrimitiveState> = {
  /**
   * @param state
   * @param callback
   */
  setState(
    state: SetStateAction<S>,
    callback?: StateCallback<S>,
  ): void;
};

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
export type SyncUpdateType<S extends PrimitiveState> = {
  /**
   * @param state
   * @param callback
   */
  syncUpdate(
    state: SetStateAction<S>,
    callback?: StateCallback<S>,
  ): void;
};

/** Type of restore */
export type RestoreType<S extends PrimitiveState> = {
  /**
   * @param callback
   * @description The reason for not naming it reset is due to
   * the consideration of scenarios where the createStore parameter might be a function.
   * In such cases, logically speaking, it's not so much about resetting but rather about restoring.
   * As for what state it restores to depends on the result returned by the execution of the initialization function.
   * Hence, the choice of the name restore instead of reset.
   */
  restore(callback?: StateCallback<S>): void;
};

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
export type SetOptionsType = {
  setOptions(options: Readonly<{ unmountRestore: boolean }>): void;
};

/**
 * @description When executed in conjunction with "setOptions",
 * it allows users to make different coding decisions based on various configurations,
 * while being aware of the current settings.
 * 🌟 Different from the considerations for the parameter types of "setOptions",
 * "getOptions" returns a configuration object for all settings.
 * This is because these read-only settings do not affect code security,
 * and the parameters for "setOptions" are only aimed at the "unmountRestore" configuration item.
 * Providing all configuration items may also be for the convenience of subsequent internal coding considerations.
 */
export type GetOptionsType = {
  getOptions(): InnerStoreOptions;
};

/** type of useStore */
export type UseStoreType<S extends PrimitiveState> = {
  useStore(): ClassicStore<S>;
};

/**
 * @description The store returned by `createStore`,
 * which then calls the result returned by `useStore`,
 * is referred to as the classical type of store.
 */
export type ClassicStore<S extends PrimitiveState> = Omit<Store<S>, "useStore">;

/** A preprocessed store that is ready for immediate rendering  */
export type MacroStore<S extends PrimitiveState> = ClassicStore<S> & StoreType<S>;

/** The function type returned by definiteStore */
export type UseMacroStore<S extends PrimitiveState> = () => MacroStore<S>;

/**
 * type of useSubscription
 * @description It`s advantage is that you only need to consider the data you want to subscribe to,
 * rather than the psychological burden to consider whether the data reference inside the function can get the latest value.
 * UseSubscription will reduce your mental burden and allow you to use it normally.
 */
export interface UseSubscriptionType<S extends PrimitiveState> {
  useSubscription(listener: ListenerType<S>, stateKeys?: (keyof S)[]): void;
}

/** Type of key disabled in the initialization parameters */
export type InitialStateForbiddenKeys = keyof StoreUtils<PrimitiveState> | "store";

/** The type of this context in function properties (actions) within initialState. */
export type StateThis<S extends PrimitiveState> = {
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
  } & ThisType<StateThis<S>>;

/** Type of initialize data */
export type InitialState<S extends PrimitiveState> = (() => StateWithThisType<S>) | StateWithThisType<S>;

// Type of counter for store
export type StateRefCounterMapType = MapType<{
  counter: number;
}>;

export type AnyBoundFn = AnyFn & {
  /**
   * @description The flag attribute bound to the internal processing function attribute.
   */
  __bound__?: boolean;
};

export type MutateReducerPreviousType<S extends PrimitiveState> = {
  parent: Record<string | symbol, any> | MapType<S>;
  accumulator: Record<string | symbol, any>;
};
