import type { PrimitiveState } from "../types";
import type MetaState from "./index";

// Type of metaStateMap
export type MetaStateMapType<S extends PrimitiveState> = Record<keyof S, MetaState<S>>;
