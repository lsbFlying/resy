import type { PrimitiveState } from "../types";
import StateMeta from "./index";

export type GetStateMetaType<S extends PrimitiveState> = (key: keyof S) => StateMeta<S>;
