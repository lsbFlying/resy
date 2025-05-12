import type { PrimitiveState } from "../types";
import type { State, Store, StoreCoreUtils } from "../store/types";
import {
  __CLASS_THIS_POINTER_STORES_KEY__, __CLASS_STATE_REF_SET_KEY__, __CLASS_IS_MOUNTED_KEY__,
} from "./static";

/** This is the data type returned by the class after connecting to the store */
export type ClassStoreType<S extends PrimitiveState> = S & StoreCoreUtils<S>;

// The types of different store mounted on this pointer of the class component
export type ClassThisPointerStoresType<S extends PrimitiveState = any> = {
  [__CLASS_THIS_POINTER_STORES_KEY__]: Set<Store<S>>;
};

// The type of the set collection referenced by the state data of the class component
export type ClassStateRefSetType<S extends PrimitiveState> = {
  [__CLASS_STATE_REF_SET_KEY__]: Set<keyof S>;
};

export type ClassIsMountedType = {
  [__CLASS_IS_MOUNTED_KEY__]: boolean;
};

/** This class type of connect store */
export type ClassInstanceTypeOfConnectStore<S extends PrimitiveState> =
  PrimitiveState &
  Readonly<{ setState(state: State<S>): void }> &
  ClassThisPointerStoresType &
  ClassStateRefSetType<S> &
  ClassIsMountedType;
