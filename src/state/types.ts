import type { PrimitiveState } from "../types";
import type StateMeta from "./index";

// Type of stateMetaMap
export type StateMetaMapType<S extends PrimitiveState> = Record<keyof S, StateMeta<S>>;

export type GetStateMetaType<S extends PrimitiveState> = (key: keyof S) => StateMeta<S>;
