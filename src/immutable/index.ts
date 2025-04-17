import type {
  ArrayPrototypeProxyableKeyType, MapPrototypeProxyableKeyType,
  ArrayPrototypeProxyableFactoryType, MapPrototypeProxyableFactoryType,
} from "./types";
import {
  applyLoopFactory, applyPushFactory, applyPopFactory,
  applyFillFactory, applyReverseFactory, applyShiftFactory,
  applyUnshiftFactory, applySortFactory, applySpliceFactory,
  applyCopyWithinFactory, applyReduceFactory,
} from "./mutate-array";
import {
  applyFlatFactory, applyToReversedFactory, applyToSortedFactory,
  applyAtFactory, applyValuesFactory, applyConcatFactory,
  applyEntriesFactory, applySliceFactory, applyWithFactory,
} from "./immutable-array";
import { applyGetFactory, applyClearFactory, applyDeleteFactory } from "./map";

export const __ARRAY_MAP_SET_PROTOTYPE_PROXYABLE_TARGET_MAP__ = new Map<
  | ArrayPrototypeProxyableKeyType
  | MapPrototypeProxyableKeyType,
  | ArrayPrototypeProxyableFactoryType
  | MapPrototypeProxyableFactoryType
>()
  .set("forEach", applyLoopFactory)
  .set("map", applyLoopFactory)
  .set("filter", applyLoopFactory)
  .set("find", applyLoopFactory)
  .set("findIndex", applyLoopFactory)
  .set("findLast", applyLoopFactory)
  .set("findLastIndex", applyLoopFactory)
  .set("every", applyLoopFactory)
  .set("some", applyLoopFactory)
  .set("flatMap", applyLoopFactory)
  .set("flat", applyFlatFactory)
  .set("push", applyPushFactory)
  .set("pop", applyPopFactory)
  .set("fill", applyFillFactory)
  .set("reverse", applyReverseFactory)
  .set("toReversed", applyToReversedFactory)
  .set("shift", applyShiftFactory)
  .set("unshift", applyUnshiftFactory)
  .set("sort", applySortFactory)
  .set("toSorted", applyToSortedFactory)
  .set("splice", applySpliceFactory)
  .set("copyWithin", applyCopyWithinFactory)
  .set("at", applyAtFactory)
  .set("values", applyValuesFactory)
  .set("concat", applyConcatFactory)
  .set("entries", applyEntriesFactory)
  .set("reduce", applyReduceFactory)
  .set("reduceRight", applyReduceFactory)
  .set("slice", applySliceFactory)
  .set("with", applyWithFactory)
  .set("get", applyGetFactory)
  .set("clear", applyClearFactory)
  .set("delete", applyDeleteFactory);
