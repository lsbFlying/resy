import type { PrimitiveState, ValueOf } from "../types";
import type { Store } from "../store/types";

// todo 目前暂时支持对象、数组
export type ProxyableType<S extends PrimitiveState> = S | S[];

export type CreateProxyType<S extends PrimitiveState> = (
  target: ProxyableType<S>,
  parentTarget?: ProxyableType<S>,
  firstLevelKey?: keyof S,
  keyChains?: string,
  applyOriginFunction?: ArrayPrototypeProxyableValueType,
) => Store<S>;

export type ArrayPrototypeProxyableType<T extends PrimitiveState = {}> = Pick<
  Array<T>,
  | "forEach"
  | "map"
  | "filter"
  | "every"
  | "some"
  | "push"
  | "pop"
  | "fill"
  | "reverse"
  | "shift"
  | "unshift"
  | "sort"
  | "splice"
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
  keyChains?: string,
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
  keyChains?: string,
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
