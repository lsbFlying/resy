import type {
  ArrayPrototypeProxyableValueType, MapPrototypeProxyableValueType,
  ArrayPrototypeProxyableFactoryType, MapPrototypeProxyableFactoryType,
  SetPrototypeProxyableValueType, SetPrototypeProxyableFactoryType,
} from "./types";
import {
  applyLoopFactory, applyPushFactory, applyPopFactory,
  applyFillFactory, applyReverseFactory, applyShiftFactory,
  applyUnshiftFactory, applySortFactory, applySpliceFactory,
  applyCopyWithinFactory, applyReduceFactory,
} from "./mutate-array";
import {
  applyFlatFactory, applyToReversedFactory, applyToSortedFactory,
  applyAtFactory, applyArrayValuesFactory, applyConcatFactory,
  applyArrayEntriesFactory, applySliceFactory, applyWithFactory,
} from "./immutable-array";
import {
  applyGetFactory, applyMapClearFactory, applyMapDeleteFactory, applySetFactory,
  applyMapForEachFactory, applyMapValuesFactory, applyMapEntriesFactory,
} from "./map";
import {
  applyAddFactory, applySetClearFactory, applySetDeleteFactory, applySetForEachFactory,
  applySetKeysValuesFactory, applySetEntriesFactory,
} from "./set";

export const __ARRAY_MAP_SET_PROTOTYPE_PROXYABLE_TARGET__ = new Map<
  | ArrayPrototypeProxyableValueType
  | MapPrototypeProxyableValueType
  | SetPrototypeProxyableValueType,
  | ArrayPrototypeProxyableFactoryType
  | MapPrototypeProxyableFactoryType
  | SetPrototypeProxyableFactoryType
>()
  // array
  .set(Array.prototype.forEach, applyLoopFactory)
  .set(Array.prototype.map, applyLoopFactory)
  .set(Array.prototype.filter, applyLoopFactory)
  .set(Array.prototype.find, applyLoopFactory)
  .set(Array.prototype.findIndex, applyLoopFactory)
  .set(Array.prototype.findLast, applyLoopFactory)
  .set(Array.prototype.findLastIndex, applyLoopFactory)
  .set(Array.prototype.every, applyLoopFactory)
  .set(Array.prototype.some, applyLoopFactory)
  .set(Array.prototype.flatMap, applyLoopFactory)
  .set(Array.prototype.flat, applyFlatFactory)
  .set(Array.prototype.push, applyPushFactory)
  .set(Array.prototype.pop, applyPopFactory)
  .set(Array.prototype.fill, applyFillFactory)
  .set(Array.prototype.reverse, applyReverseFactory)
  .set(Array.prototype.toReversed, applyToReversedFactory)
  .set(Array.prototype.shift, applyShiftFactory)
  .set(Array.prototype.unshift, applyUnshiftFactory)
  .set(Array.prototype.sort, applySortFactory)
  .set(Array.prototype.toSorted, applyToSortedFactory)
  .set(Array.prototype.splice, applySpliceFactory)
  .set(Array.prototype.copyWithin, applyCopyWithinFactory)
  .set(Array.prototype.at, applyAtFactory)
  .set(Array.prototype.values, applyArrayValuesFactory)
  .set(Array.prototype.concat, applyConcatFactory)
  .set(Array.prototype.entries, applyArrayEntriesFactory)
  .set(Array.prototype.reduce, applyReduceFactory)
  .set(Array.prototype.reduceRight, applyReduceFactory)
  .set(Array.prototype.slice, applySliceFactory)
  .set(Array.prototype.with, applyWithFactory)
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
