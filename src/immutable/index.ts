import type {
  MapPrototypeProxyableValueType, MapPrototypeProxyableFactoryType,
  SetPrototypeProxyableValueType, SetPrototypeProxyableFactoryType,
} from "./types";
import applyMapPrototypeFactory from "./map";
import applySetPrototypeFactory from "./set";

export const _MAP_SET_PROTOTYPE_PROXYABLE_TARGET_ = new Map<
  | MapPrototypeProxyableValueType
  | SetPrototypeProxyableValueType,
  | MapPrototypeProxyableFactoryType
  | SetPrototypeProxyableFactoryType
>()
  // map
  .set(Map.prototype.get, applyMapPrototypeFactory)
  .set(Map.prototype.clear, applyMapPrototypeFactory)
  .set(Map.prototype.delete, applyMapPrototypeFactory)
  .set(Map.prototype.set, applyMapPrototypeFactory)
  .set(Map.prototype.forEach, applyMapPrototypeFactory)
  .set(Map.prototype.values, applyMapPrototypeFactory)
  .set(Map.prototype.entries, applyMapPrototypeFactory)
  // set
  .set(Set.prototype.add, applySetPrototypeFactory)
  .set(Set.prototype.clear, applySetPrototypeFactory)
  .set(Set.prototype.delete, applySetPrototypeFactory)
  .set(Set.prototype.forEach, applySetPrototypeFactory)
  .set(Set.prototype.keys, applySetPrototypeFactory)
  .set(Set.prototype.values, applySetPrototypeFactory)
  .set(Set.prototype.entries, applySetPrototypeFactory);
