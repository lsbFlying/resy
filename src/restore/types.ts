import type { MapType } from "../types";

// If initialState is a function,
// you can get the execution flag in the initialStateRetrieve handler of useStore.
export type InitialFnCanExecMapType = MapType<{
  canExec?: boolean | null;
}>;
