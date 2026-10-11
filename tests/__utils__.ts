import type { PrimitiveState } from "../src/types";
import type MetaStore from "../src/store/core";

/**
 * @description Test helper: read the *raw* store state.
 *
 * `store` is a proxy whose `_$state_` read returns the current root, which is
 * indistinguishable from the real reference in some assertions. Going through
 * the internal `MetaStore` instance gives the exact object React compares, so
 * "did the root identity change" can be asserted truthfully.
 */
export const rawMetaStore = <S extends PrimitiveState>(store: unknown): MetaStore<S> =>
  (store as { _updater_: { $metaStore: MetaStore<S> } })._updater_.$metaStore;

/** Raw, un-proxied snapshot object. */
export const rawState = <S extends PrimitiveState>(store: unknown): S =>
  rawMetaStore<S>(store)._$state_;
