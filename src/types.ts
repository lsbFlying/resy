export type Callback = () => void;

export type PrimitiveState = Record<number | string, any>;

export type AnyFn = (...args: unknown[]) => unknown;

export type ValueOf<S extends PrimitiveState> = S[keyof S];

export type MapType<S extends PrimitiveState> = Map<keyof S, ValueOf<S>>;

export type ObjectType<S extends PrimitiveState> = { [K in keyof S]: S[K] };

export type ObjectMapType<S extends PrimitiveState> = { [K in keyof S]: MapType<S> };
