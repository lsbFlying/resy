import type {
  MapPrototypeProxyableValueType,
  MapPrototypeProxyableFactoryType,
  SetPrototypeProxyableValueType, SetPrototypeProxyableFactoryType,
} from "./types";
import {
  applyGetFactory, applyMapClearFactory, applyMapDeleteFactory, applySetFactory,
  applyMapForEachFactory, applyMapValuesFactory, applyMapEntriesFactory,
} from "./map";
import {
  applyAddFactory, applySetClearFactory, applySetDeleteFactory, applySetForEachFactory,
  applySetKeysValuesFactory, applySetEntriesFactory,
} from "./set";

export const __ARRAY_MAP_SET_PROTOTYPE_PROXYABLE_TARGET__ = new Map<
  | MapPrototypeProxyableValueType
  | SetPrototypeProxyableValueType,
  | MapPrototypeProxyableFactoryType
  | SetPrototypeProxyableFactoryType
>()
  // map
  .set(Map.prototype.get, applyGetFactory)
  .set(Map.prototype.clear, applyMapClearFactory)
  .set(Map.prototype.delete, applyMapDeleteFactory)
  .set(Map.prototype.set, applySetFactory)
  .set(Map.prototype.forEach, applyMapForEachFactory)
  .set(Map.prototype.values, applyMapValuesFactory)
  .set(Map.prototype.entries, applyMapEntriesFactory)
  // set
  .set(Set.prototype.add, applyAddFactory)
  .set(Set.prototype.clear, applySetClearFactory)
  .set(Set.prototype.delete, applySetDeleteFactory)
  .set(Set.prototype.forEach, applySetForEachFactory)
  .set(Set.prototype.keys, applySetKeysValuesFactory)
  .set(Set.prototype.values, applySetKeysValuesFactory)
  .set(Set.prototype.entries, applySetEntriesFactory);
