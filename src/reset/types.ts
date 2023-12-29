import type { MapType } from "../types";

// This is the type of state switch that the stateMap restore performs
export type StateRestoreAccomplishedMapType = MapType<{
  unmountRestoreAccomplished?: boolean | null;
  initialStateFnRestoreAccomplished?: boolean | null;
}>;

// If initialState is a function,
// you can get the execution flag in the initialStateFnRestoreHandle handler of useStore.
export type InitialFnCanExecMapType = MapType<{
  canExec?: boolean;
}>;
