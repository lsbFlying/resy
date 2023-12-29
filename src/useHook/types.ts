import type { StoreCoreUtils } from "../store/types";
import type { PrimitiveState } from "../types";

/** Return type of useConciseState */
export type ConciseStore<S extends PrimitiveState> = S & StoreCoreUtils<S> & {
  readonly store: S & StoreCoreUtils<S>;
};
