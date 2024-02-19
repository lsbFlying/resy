import type { MapType } from "../types";

// This is the type of state switch that the stateMap restore performs
export type StateRestoreAccomplishedMapType = MapType<{
  unmountRestoreAccomplished?: boolean | null;
  initialStateRetrieveAccomplished?: boolean | null;
}>;

// If initialState is a function,
// you can get the execution flag in the initialStateRetrieve handler of useStore.
export type InitialFnCanExecMapType = MapType<{
  canExec?: boolean;
}>;
