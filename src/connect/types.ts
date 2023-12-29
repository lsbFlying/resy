import type { Callback, PrimitiveState } from "../types";
import type { StoreCoreUtils, SetOptions } from "../store/types";
import { __CLASS_FN_INITIAL_HANDLE_KEY__, __CLASS_UNMOUNT_HANDLE_KEY__, __CONNECT_SYMBOL_KEY__ } from "../static";

/**
 * Function types for connecting store
 * Performs some action. This method should not be overridden in subclasses.
 * Even if you rewrite it, your rewriting method won't work.
 * @description This is an important method that is core to the functionality of this class.
 */
export type ConnectStoreType = {
  connectStore<S extends PrimitiveState>(store: S): ClassStoreType<S>;
};

/** This is the data type returned by the class after connecting to the store */
export type ClassStoreType<S extends PrimitiveState> = S & StoreCoreUtils<S> & SetOptions;

// This is the connection type used by the base classes ComponentWithStore and PureComponentWithStore in the class component
export type ConnectType = {
  [__CONNECT_SYMBOL_KEY__]<S extends PrimitiveState>(): ClassStoreType<S>;
};

// This is the type of method that is executed after the class component is unmounted
export type ClassUnmountHandleType = {
  [__CLASS_UNMOUNT_HANDLE_KEY__](): void;
}

// This is the type of recovery performed by the class if the store initialization parameter is a function
export type ClassFnInitialHandleType = {
  [__CLASS_FN_INITIAL_HANDLE_KEY__](): void;
};

// Unmount the hook object type executed by the logic
export type UnmountExecutionHookObjType = {
  executionCounter: number;
  callback?: Callback | null;
};
