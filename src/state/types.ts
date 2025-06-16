import type { PrimitiveState } from "../types";
import type StateMeta from "./index";

// Type of stateMetaMap
export type StateMetaMapType<S extends PrimitiveState> = Map<keyof S, StateMeta<S>>;
