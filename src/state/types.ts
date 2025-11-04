import { Callback, PrimitiveState } from "../types";

export type MetaStateSubscriberType<S extends PrimitiveState> = ((onStateChange: Callback) => Callback) & {
  stateKeys?: (keyof S)[];
};
