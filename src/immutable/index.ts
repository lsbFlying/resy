import type {
  ArrayPrototypeProxyableKeyType,
  MapPrototypeProxyableKeyType,
  MapPrototypeProxyableGetFactoryType,
  ArrayPrototypeProxyableFactoryType,
} from "./types";
import { applyTargetGetFactory } from "./map";
import {
  applyTargetLoopFactory, applyTargetPushFactory, applyTargetPopFactory,
  applyTargetFillFactory, applyTargetReverseFactory, applyTargetShiftFactory,
  applyTargetUnshiftFactory, applyTargetSortFactory, applyTargetSpliceFactory,
  applyTargetCopyWithinFactory, applyTargetReduceFactory,
} from "./mutate-array";
import {
  applyTargetFlatFactory, applyTargetToReversedFactory, applyTargetToSortedFactory,
  applyTargetAtFactory, applyTargetValuesFactory, applyTargetConcatFactory,
  applyTargetEntriesFactory, applyTargetSliceFactory, applyTargetWithFactory,
} from "./immutable-array";

export const __ARRAY_MAP_SET_PROTOTYPE_PROXYABLE_TARGET_MAP__ = new Map<
  | ArrayPrototypeProxyableKeyType
  | MapPrototypeProxyableKeyType,
  | ArrayPrototypeProxyableFactoryType
  | MapPrototypeProxyableGetFactoryType
>()
  .set("forEach", applyTargetLoopFactory)
  .set("map", applyTargetLoopFactory)
  .set("filter", applyTargetLoopFactory)
  .set("find", applyTargetLoopFactory)
  .set("findIndex", applyTargetLoopFactory)
  .set("findLast", applyTargetLoopFactory)
  .set("findLastIndex", applyTargetLoopFactory)
  .set("every", applyTargetLoopFactory)
  .set("some", applyTargetLoopFactory)
  .set("flatMap", applyTargetLoopFactory)
  .set("flat", applyTargetFlatFactory)
  .set("push", applyTargetPushFactory)
  .set("pop", applyTargetPopFactory)
  .set("fill", applyTargetFillFactory)
  .set("reverse", applyTargetReverseFactory)
  .set("toReversed", applyTargetToReversedFactory)
  .set("shift", applyTargetShiftFactory)
  .set("unshift", applyTargetUnshiftFactory)
  .set("sort", applyTargetSortFactory)
  .set("toSorted", applyTargetToSortedFactory)
  .set("splice", applyTargetSpliceFactory)
  .set("copyWithin", applyTargetCopyWithinFactory)
  .set("at", applyTargetAtFactory)
  .set("values", applyTargetValuesFactory)
  .set("concat", applyTargetConcatFactory)
  .set("entries", applyTargetEntriesFactory)
  .set("reduce", applyTargetReduceFactory)
  .set("reduceRight", applyTargetReduceFactory)
  .set("slice", applyTargetSliceFactory)
  .set("with", applyTargetWithFactory)
  .set("get", applyTargetGetFactory);
