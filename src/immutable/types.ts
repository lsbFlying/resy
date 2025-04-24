import type { MapType, PrimitiveState, ValueOf } from "../types";
import type { Store } from "../store/types";
import { __ITERATOR_META_PROCESSING_KEY__ } from "./static";

export type ProxyableType<S extends PrimitiveState> = S | S[] | MapType<S> | Set<S>;

// The collection of attribute chains set as object types is
// to prevent different levels of attributes from having the same attribute name.
export type KeyChainsSourceItemType<S extends PrimitiveState> = {
  key: keyof S;
};

export type CreateProxyType<S extends PrimitiveState> = (
  target: ProxyableType<S>,
  parentTarget?: ProxyableType<S>,
  firstLevelKey?: keyof S,
  keyLevel?: number,
  keyChains?: Set<KeyChainsSourceItemType<S>>,
  applyOriginFunction?: ApplyOriginFunctionType,
) => Store<S>;

export type ApplyOriginFunctionType = MapPrototypeProxyableValueType | SetPrototypeProxyableValueType;

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
export type MapPrototypeProxyableValueType = ValueOf<MapPrototypeProxyableType>;

export type MapPrototypeProxyableFactoryType = <S extends PrimitiveState>(
  applyOriginFunction: MapPrototypeProxyableValueType,
  thisArg: MapType<S>,
  stateMap: MapType<S>,
  parentTarget: MapType<S>,
  createProxy: CreateProxyType<S>,
  firstLevelKey?: keyof S,
  keyLevel?: number,
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
export type MapPrototypeProxyableSetFactoryValueType<S extends PrimitiveState> = (key: keyof S, value: ValueOf<S>) => MapType<S>;
export type MapPrototypeProxyableForEachFactoryValueType<S extends PrimitiveState> = (
  callback: (value: ValueOf<S>, key: keyof S, map: Map<keyof S, ValueOf<S>>) => void
) => void;

export type SetPrototypeProxyableType<T extends PrimitiveState = any> = Pick<
  Set<T>,
  | "add"
  | "clear"
  | "delete"
  | "forEach"
  | "keys"
  | "values"
  | "entries"
>;
export type SetPrototypeProxyableValueType = ValueOf<SetPrototypeProxyableType>;

export type SetPrototypeProxyableFactoryType = <S extends PrimitiveState>(
  applyOriginFunction: SetPrototypeProxyableValueType,
  thisArg: Set<S>,
  stateMap: MapType<S>,
  parentTarget: Set<S>,
  createProxy: CreateProxyType<S>,
  firstLevelKey?: keyof S,
  keyLevel?: number,
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
  | SetPrototypeProxyableAddFactoryValueType<S>
  | SetPrototypeProxyableClearFactoryValueType
  | SetPrototypeProxyableDeleteFactoryValueType<S>
  | SetPrototypeProxyableForEachFactoryValueType<S>
);

export type SetPrototypeProxyableAddFactoryValueType<S extends PrimitiveState> = (value: S) => Set<S>;
export type SetPrototypeProxyableClearFactoryValueType = () => void;
export type SetPrototypeProxyableDeleteFactoryValueType<S extends PrimitiveState> = (value: S) => boolean;
export type SetPrototypeProxyableForEachFactoryValueType<S extends PrimitiveState> = (
  callback: (
    value: S, value2: S, map: Set<S>
  ) => void
) => void;

export type IteratorsType<S extends PrimitiveState> = ArrayLike<S> & {
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

export type IteratorsParentType<S extends PrimitiveState> = ProxyableType<S> & {
  [__ITERATOR_META_PROCESSING_KEY__]?: boolean;
};

export type ArrayMapSetIteratorType<S extends PrimitiveState> = ArrayIterator<S> | MapIterator<S> | SetIterator<S>;
