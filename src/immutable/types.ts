import type { MapType, PrimitiveState, ValueOf } from "../types";
import type { Store } from "../store/types";

export type ProxyableType<S extends PrimitiveState> = S | S[] | MapType<S>;

// The collection of attribute chains set as object types is
// to prevent different levels of attributes from having the same attribute name.
export type KeyChainsSourceItemType<S extends PrimitiveState> = {
  key: keyof S;
};

export type CreateProxyType<S extends PrimitiveState> = (
  target: ProxyableType<S>,
  parentTarget?: ProxyableType<S>,
  firstLevelKey?: keyof S,
  keyChains?: Set<KeyChainsSourceItemType<S>>,
  applyOriginFunction?: ArrayPrototypeProxyableValueType,
) => Store<S>;

export type ArrayPrototypeProxyableType<T extends PrimitiveState = {}> = Pick<
  Array<T>,
  | "forEach"
  | "map"
  | "filter"
  | "find"
  | "findIndex"
  | "findLast"
  | "findLastIndex"
  | "every"
  | "some"
  | "flatMap"
  | "push"
  | "pop"
  | "fill"
  | "reverse"
  | "toReversed"
  | "shift"
  | "unshift"
  | "sort"
  | "toSorted"
  | "splice"
  | "copyWithin"
  | "at"
  | "values"
>;
export type ArrayPrototypeProxyableKeyType = keyof ArrayPrototypeProxyableType;
export type ArrayPrototypeProxyableValueType = ValueOf<ArrayPrototypeProxyableType>;

export type ArrayPrototypeProxyableCallbackType<T = any> = (value: T, index: number, array: T[]) => (void | T);

export type ArrayPrototypeProxyableLoopFactoryType = <S extends PrimitiveState>(
  storeProxyWeakMap: WeakMap<object, Store<S>>,
  applyOriginFunction: ArrayPrototypeProxyableValueType,
  thisArg: S[],
  parentTarget: S[],
  createProxy: CreateProxyType<S>,
  firstLevelKey?: keyof S,
  keyChains?: Set<KeyChainsSourceItemType<S>>,
) => ArrayPrototypeProxyableLoopFactoryValueType;

export type ArrayPrototypeProxyableLoopFactoryValueType = <T>(callback: ArrayPrototypeProxyableCallbackType) => (void | T[]);

export type ArrayPrototypeProxyableFactoryType = <S extends PrimitiveState>(
  storeProxyWeakMap: WeakMap<object, Store<S>>,
  applyOriginFunction: ArrayPrototypeProxyableValueType,
  thisArg: S[],
  parentTarget: S[],
) => ArrayPrototypeProxyableFactoryValueType;

export type ArrayPrototypeProxyableFactoryValueType = <T>(...items: T[]) => any;

export type ArrayPrototypeProxyableSortFactoryType = <S extends PrimitiveState>(
  storeProxyWeakMap: WeakMap<object, Store<S>>,
  applyOriginFunction: ArrayPrototypeProxyableValueType,
  thisArg: S[],
  parentTarget: S[],
  createProxy: CreateProxyType<S>,
  firstLevelKey?: keyof S,
  keyChains?: Set<KeyChainsSourceItemType<S>>,
) => ArrayPrototypeProxyableFactorySortValueType;

export type ArrayPrototypeProxyableFactorySortValueType = <T>(compareFn?: (a: T, b: T) => number) => T[];

export type ArrayPrototypeProxyableSpliceFactoryType = <S extends PrimitiveState>(
  storeProxyWeakMap: WeakMap<object, Store<S>>,
  applyOriginFunction: ArrayPrototypeProxyableValueType,
  thisArg: S[],
  parentTarget: S[],
) => ArrayPrototypeProxyableFactorySpliceValueType;

export type ArrayPrototypeProxyableFactorySpliceValueType = <T>(
  start: number,
  deleteCount: number,
  ...items: T[]
) => T[];

export type ArrayPrototypeProxyableCopyWithinFactoryType = <S extends PrimitiveState>(
  storeProxyWeakMap: WeakMap<object, Store<S>>,
  applyOriginFunction: ArrayPrototypeProxyableValueType,
  thisArg: S[],
  parentTarget: S[],
) => ArrayPrototypeProxyableFactoryCopyWithinValueType;

export type ArrayPrototypeProxyableFactoryCopyWithinValueType = <T>(
  target: number,
  start: number,
  end?: number,
) => T[];

export type ArrayPrototypeProxyableAtFactoryType = <S extends PrimitiveState>(
  storeProxyWeakMap: WeakMap<object, Store<S>>,
  applyOriginFunction: ArrayPrototypeProxyableValueType,
  thisArg: S[],
  parentTarget: S[],
  createProxy: CreateProxyType<S>,
  firstLevelKey?: keyof S,
  keyChains?: Set<KeyChainsSourceItemType<S>>,
) => ArrayPrototypeProxyableAtFactoryValueType;

export type ArrayPrototypeProxyableAtFactoryValueType = <T>(index: number) => (T | undefined);

export type ArrayPrototypeProxyableValuesFactoryType = <S extends PrimitiveState>(
  storeProxyWeakMap: WeakMap<object, Store<S>>,
  applyOriginFunction: ArrayPrototypeProxyableValueType,
  thisArg: S[],
  parentTarget: S[],
  createProxy: CreateProxyType<S>,
  firstLevelKey?: keyof S,
  keyChains?: Set<KeyChainsSourceItemType<S>>,
) => ArrayPrototypeProxyableValuesFactoryValueType;

export type ArrayPrototypeProxyableValuesFactoryValueType = <T>() => ArrayIterator<T>;

export type MapPrototypeProxyableType<T extends PrimitiveState = {}> = Pick<
  Map<keyof T, ValueOf<T>>,
  | "get"
>;
export type MapPrototypeProxyableKeyType = keyof MapPrototypeProxyableType;
export type MapPrototypeProxyableValueType = ValueOf<MapPrototypeProxyableType>;

export type MapPrototypeProxyableGetFactoryType = <S extends PrimitiveState>(
  storeProxyWeakMap: WeakMap<object, Store<S>>,
  applyOriginFunction: MapPrototypeProxyableValueType,
  thisArg: MapType<S>,
  parentTarget: MapType<S>,
  createProxy: CreateProxyType<S>,
  firstLevelKey?: keyof S,
  keyChains?: Set<KeyChainsSourceItemType<S>>,
) => MapPrototypeProxyableGetFactoryValueType<S>;

export type MapPrototypeProxyableGetFactoryValueType<S extends PrimitiveState> = (key: keyof S) => ValueOf<S> | undefined;
