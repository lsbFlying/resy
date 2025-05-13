import type { PrimitiveState } from "../types";
import type { StoreCoreUtils } from "../store/types";

/** This is the data type returned by the class after connecting to the store */
export type ClassStoreType<S extends PrimitiveState> = S & StoreCoreUtils<S>;
