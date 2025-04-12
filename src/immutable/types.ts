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
  | "shift"
  | "unshift"
  | "sort"
  | "splice"
  | "copyWithin"
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

export type ArrayPrototypeProxyableMutableArrayFactoryType = <S extends PrimitiveState>(
  storeProxyWeakMap: WeakMap<object, Store<S>>,
  applyOriginFunction: ArrayPrototypeProxyableValueType,
  thisArg: S[],
  parentTarget: S[],
) => ArrayPrototypeProxyableMutableArrayFactoryNormalValueType;

export type ArrayPrototypeProxyableMutableArrayFactoryNormalValueType = <T>(...items: T[]) => any;

export type ArrayPrototypeProxyableMutableArraySortFactoryType = <S extends PrimitiveState>(
  storeProxyWeakMap: WeakMap<object, Store<S>>,
  applyOriginFunction: ArrayPrototypeProxyableValueType,
  thisArg: S[],
  parentTarget: S[],
  createProxy: CreateProxyType<S>,
  firstLevelKey?: keyof S,
  keyChains?: Set<KeyChainsSourceItemType<S>>,
) => ArrayPrototypeProxyableMutableArrayFactorySortValueType;

export type ArrayPrototypeProxyableMutableArrayFactorySortValueType = <T>(compareFn?: (a: T, b: T) => number) => T[];

export type ArrayPrototypeProxyableMutableArraySpliceFactoryType = <S extends PrimitiveState>(
  storeProxyWeakMap: WeakMap<object, Store<S>>,
  applyOriginFunction: ArrayPrototypeProxyableValueType,
  thisArg: S[],
  parentTarget: S[],
) => ArrayPrototypeProxyableMutableArrayFactorySpliceValueType;

export type ArrayPrototypeProxyableMutableArrayFactorySpliceValueType = <T>(
  start: number,
  deleteCount: number,
  ...items: T[]
) => T[];

export type ArrayPrototypeProxyableMutableArrayCopyWithinFactoryType = <S extends PrimitiveState>(
  storeProxyWeakMap: WeakMap<object, Store<S>>,
  applyOriginFunction: ArrayPrototypeProxyableValueType,
  thisArg: S[],
  parentTarget: S[],
) => ArrayPrototypeProxyableMutableArrayFactoryCopyWithinValueType;

export type ArrayPrototypeProxyableMutableArrayFactoryCopyWithinValueType = <T>(
  target: number,
  start: number,
  end?: number,
) => T[];

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
