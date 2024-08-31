import type { PrimitiveState } from "../types";
import type { ConciseStoreCore, SetOptions, State, Store, StoreCoreUtils } from "../store/types";
import {
  __CLASS_INITIAL_STATE_RETRIEVE_KEY__, __CLASS_THIS_POINTER_STORES_KEY__,
  __CLASS_STATE_REF_SET_KEY__, __CLASS_UNMOUNT_PROCESSING_KEY__, __CLASS_CONNECT_STORE_KEY__,
} from "./static";

/**
 * @description This is an important method that is core to the functionality of this class.
 * Performs some action. This method should not be overridden in subclasses.
 * Even if you rewrite it, your rewriting method should be like this below:
 * connectStore<S extends PrimitiveState>(store: S): S & SetOptions & StoreCoreUtils<S> {
 *   ...
 *   return super.connectStore(store);
 * }
 * @interface connectStore
 * @param store
 */
export type ConnectStoreType = Readonly<{
  connectStore<S extends PrimitiveState>(store: Store<S> | ConciseStoreCore<S>): ClassStoreType<S>;
}>;

/** This is the data type returned by the class after connecting to the store */
export type ClassStoreType<S extends PrimitiveState> = S & StoreCoreUtils<S> & Readonly<SetOptions>;

// This is the connection type used by the base classes ComponentWithStore and PureComponentWithStore in the class component
export type ClassConnectStoreType = {
  [__CLASS_CONNECT_STORE_KEY__]<S extends PrimitiveState>(): ClassStoreType<S>;
};

// The types of different store mounted on this pointer of the class component
export type ClassThisPointerStoresType<S extends PrimitiveState = any> = {
  [__CLASS_THIS_POINTER_STORES_KEY__]: Set<Store<S>>;
};

// The type of the set collection referenced by the state data of the class component
export type ClassStateRefSetType<S extends PrimitiveState> = {
  [__CLASS_STATE_REF_SET_KEY__]: Set<keyof S>;
};

// This is the type of method that is executed after the class component is unmounted
export type ClassUnmountProcessingType = {
  [__CLASS_UNMOUNT_PROCESSING_KEY__](): void;
}

// This is the type of recovery performed by the class if the store initialization parameter is a function
export type ClassInitialStateRetrieveType = {
  [__CLASS_INITIAL_STATE_RETRIEVE_KEY__](): void;
};

/** This class type of connect store */
export type ClassInstanceTypeOfConnectStore<S extends PrimitiveState> =
  PrimitiveState &
  Readonly<{ setState(state: State<S>): void }> &
  ClassConnectStoreType &
  ClassThisPointerStoresType &
  ClassStateRefSetType<S> &
  {
    updater: {
      isMounted(classComponentInstance: any): boolean;
    };
  };
