/** 回调函数类型 */
export type Callback = () => void;

/**
 * @description 初始化数据的原始继承类型，目前没有想到键为symbol的状态使用场景，
 * 且支持symbol的键数据状态场景较为复杂，所以暂时不予支持symbol类型的键
 */
export type PrimitiveState = Record<number | string, any>;

/** 函数类型，Function的替代类型 */
export type AnyFn = (...args: unknown[]) => unknown;

/** object类型的值类型推断 */
export type ValueOf<S extends PrimitiveState> = S[keyof S];

/** map类型推断 */
export type MapType<S extends PrimitiveState> = Map<keyof S, ValueOf<S>>;

/** object类型推断 */
export type ObjectType<S extends PrimitiveState> = { [key in keyof S]: S[key] };

/** object值类型是map的类型推断 */
export type ObjectMapType<S extends PrimitiveState> = { [key in keyof S]: MapType<S> };
