import type { PrimitiveState, AnyFn } from "../types";
import type { SubscribeType, UseSubscriptionType } from "../subscribe/types";
import type { RestoreType } from "../restore/types";
import type { SetStateType, SyncUpdateType } from "../updater/types";

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
   * @description Create the next immutable state tree by simply modifying the current tree
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
export type StoreUtils<S extends PrimitiveState> = StoreCoreUtils<S> & StoreHookUtils<S>;

/** The type of store returned by createStore */
export type Store<S extends PrimitiveState> = S & StoreUtils<S>;

export interface StoreType<S extends PrimitiveState> {
  readonly store: Store<S>;
}

/**
 * @description The store returned by `createStore`,
 * which then calls the result returned by `useStore`,
 * is referred to as the classical type of store.
 */
export type ClassicStore<S extends PrimitiveState> = Omit<Store<S>, "useStore">;

/** type of useStore */
export type UseStoreType<S extends PrimitiveState> = {
  useStore(): ClassicStore<S>;
};

/** A preprocessed store that is ready for immediate rendering  */
export type MacroStore<S extends PrimitiveState> = ClassicStore<S> & StoreType<S>;

/** The function type returned by definiteStore */
export type UseMacroStore<S extends PrimitiveState> = () => MacroStore<S>;

/** Type of key disabled in the initialization parameters */
export type InitialStateForbiddenKeys = keyof StoreUtils<PrimitiveState> | "store";

type ComputedPrefix = `$${string}`;

export type Computed<T extends AnyFn> = T & {
  __computed__?: ReturnType<T>;
};

// Safer type restrictions
type SecureState<S extends PrimitiveState> = {
  [K in keyof S]: K extends InitialStateForbiddenKeys
    ? never
    : K extends ComputedPrefix
      ? Computed<S[K]>
      : S[K];
};

/** The type of this context in function properties (actions) within initialState. */
export type StateThis<S extends PrimitiveState> = SecureState<S> & Store<S>;

/** Parameter types disabled for initialization of InitialState */
export type PrimateForbiddenType =
  | number | string | null | symbol | boolean
  | Set<any> | Map<any, any> | Array<any>
  | WeakSet<any> | WeakMap<any, any> | WeakRef<any>
  | RegExp | bigint | Date
  | ArrayIterator<any> | SetIterator<any> | MapIterator<any>
  | Promise<any> | FormData | Blob | File | Error | CustomEvent | Storage
  | WebSocket | ArrayBuffer | DataView
  | Uint8Array | Int8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array
  | Uint32Array | Float32Array | Float64Array | BigInt64Array | BigUint64Array
  | XMLHttpRequest | Headers | Request | Response | Window;

/** Parameter types with this type pointing to identification */
export type StateWithThisType<S extends PrimitiveState> = S extends PrimateForbiddenType
  ? never
  : S & SecureState<S> & ThisType<StateThis<S>>;

/** Type of initialize data */
export type InitialState<S extends PrimitiveState> = (() => StateWithThisType<S>) | StateWithThisType<S>;

export type AnyBoundFn = AnyFn & {
  /**
   * @description The flag attribute bound to the internal processing function attribute.
   */
  __bound__?: boolean;
};
