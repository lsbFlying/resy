import type { MapType, PrimitiveState, ValueOf } from "../types";
import type { Store } from "../store/types";
import { __GRANDPARENT_KEY__ } from "./static";

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
  applyOriginFunction?: ApplyOriginFunctionType,
) => Store<S>;

export type ApplyOriginFunctionType = ArrayPrototypeProxyableValueType | MapPrototypeProxyableValueType;

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
  | "flat"
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
  | "concat"
  | "entries"
  | "reduce"
  | "reduceRight"
  | "slice"
  | "with"
>;
export type ArrayPrototypeProxyableKeyType = keyof ArrayPrototypeProxyableType;
export type ArrayPrototypeProxyableValueType = ValueOf<ArrayPrototypeProxyableType>;

export type ArrayPrototypeProxyableCallbackType<T = any> = (value: T, index: number, array: T[]) => (void | T);

export type ArrayPrototypeProxyableLoopFactoryValueType = <T>(callback: ArrayPrototypeProxyableCallbackType) => (void | T[]);

export type ArrayPrototypeProxyablePushFactoryValueType = <T>(...items: T[]) => number;

export type ArrayPrototypeProxyableSortFactoryValueType = <T>(compareFn?: (a: T, b: T) => number) => T[];

export type ArrayPrototypeProxyableCopyWithinFactoryValueType = <T>(
  target: number,
  start: number,
  end?: number,
) => T[];

export type ArrayPrototypeProxyableAtFactoryValueType = <T>(index: number) => (T | undefined);

export type ArrayPrototypeProxyableValuesFactoryValueType = <T>() => ArrayIterator<T>;

export type ArrayPrototypeProxyableConcatFactoryValueType = <T>(...items: (T | ConcatArray<T>)[]) => T[];

export type ArrayPrototypeProxyableEntriesFactoryValueType = <T>() => ArrayIterator<[number, T]>;

export type ArrayPrototypeProxyableFlatFactoryValueType = <A, D extends number = 1>(this: A, depth?: D) => FlatArray<A, D>[];

export type ArrayPrototypeProxyableReduceInitFactoryValueType = <T>(
  callback: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T,
  initialValue: T,
) => T;
export type ArrayPrototypeProxyableReduceFactoryValueType = <T>(
  callback: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T,
) => T;

export type ArrayPrototypeProxyableFactoryType = <S extends PrimitiveState>(
  storeProxyWeakMap: WeakMap<object, Map<any, Store<S>>>,
  applyOriginFunction: ArrayPrototypeProxyableValueType,
  thisArg: S[],
  parentTarget: S[],
  createProxy: CreateProxyType<S>,
  firstLevelKey?: keyof S,
  keyChains?: Set<KeyChainsSourceItemType<S>>,
) => (
  | ArrayPrototypeProxyableLoopFactoryValueType
  | ArrayPrototypeProxyableSortFactoryValueType
  | ArrayPrototypeProxyableAtFactoryValueType
  | ArrayPrototypeProxyableFlatFactoryValueType
  | ArrayPrototypeProxyableCopyWithinFactoryValueType
  | ArrayPrototypeProxyablePushFactoryValueType
  | ArrayPrototypeProxyableValuesFactoryValueType
  | ArrayPrototypeProxyableConcatFactoryValueType
  | ArrayPrototypeProxyableEntriesFactoryValueType
  | ArrayPrototypeProxyableReduceFactoryValueType
  | ArrayPrototypeProxyableReduceInitFactoryValueType
);

export type MapWithGrandparentKeyType<S extends PrimitiveState> = MapType<S> & {
  [__GRANDPARENT_KEY__]: MapWithGrandparentKeyType<S>;
};

export type MapPrototypeProxyableType<T extends PrimitiveState = any> = Pick<
  Map<keyof T, ValueOf<T>>,
  | "get"
  | "clear"
  | "delete"
  | "set"
  | "forEach"
  | "values"
  | "entries"
>;
// export type MapPrototypeProxyableKeyType = keyof MapPrototypeProxyableType;
export type MapPrototypeProxyableValueType = ValueOf<MapPrototypeProxyableType>;

export type MapPrototypeProxyableFactoryType = <S extends PrimitiveState>(
  storeProxyWeakMap: WeakMap<object, Map<any, Store<S>>>,
  applyOriginFunction: MapPrototypeProxyableValueType,
  thisArg: MapWithGrandparentKeyType<S>,
  parentTarget: MapType<S>,
  createProxy: CreateProxyType<S>,
  firstLevelKey?: keyof S,
  keyChains?: Set<KeyChainsSourceItemType<S>>,
  singleUpdate?: (
    key: keyof S,
    value: ValueOf<S>,
    isDelete: boolean,
    target: object | S,
    firstLevelKey?: keyof S,
    keyChains?: Set<KeyChainsSourceItemType<S>>,
    applyOriginFunction?: ApplyOriginFunctionType,
  ) => boolean,
) => (
  | MapPrototypeProxyableGetFactoryValueType<S>
  | MapPrototypeProxyableClearFactoryValueType
  | MapPrototypeProxyableDeleteFactoryValueType<S>
  | MapPrototypeProxyableSetFactoryValueType<S>
  | MapPrototypeProxyableForEachFactoryValueType<S>
);

export type MapPrototypeProxyableGetFactoryValueType<S extends PrimitiveState> = (key: keyof S) => ValueOf<S> | undefined;
export type MapPrototypeProxyableClearFactoryValueType = () => void;
export type MapPrototypeProxyableDeleteFactoryValueType<S extends PrimitiveState> = (key: keyof S) => boolean;
export type MapPrototypeProxyableSetFactoryValueType<S extends PrimitiveState> = (key: keyof S, value: ValueOf<S>) => boolean;
export type MapPrototypeProxyableForEachFactoryValueType<S extends PrimitiveState> = (
  value: ValueOf<S>, key: keyof S, map: Map<keyof S, ValueOf<S>>
) => void;

export type ArrayLikeIteratorsType<S extends PrimitiveState> = ArrayLike<S> & {
  [Symbol.iterator]: () => {
    next(): {
      value?: ValueOf<S> | S[] | Store<S>;
      done: boolean;
    },
  };
  next(): {
    value?: ValueOf<S> | S[] | Store<S>;
    done: boolean;
  },
};

export type ArrayMapSetIteratorType<S extends PrimitiveState> = ArrayIterator<S> | MapIterator<S> | SetIterator<S>;
