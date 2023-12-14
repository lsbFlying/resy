import type { StoreCoreUtils } from "../store/types";
import type { PrimitiveState } from "../types";

/**
 * @description useConciseState的Store返回类型
 * 增加了store的属性调用，为了完善最新数据值的获取，
 * 弥补了useState对于最新数据值获取不足的缺陷
 */
export type ConciseStore<S extends PrimitiveState> = S & StoreCoreUtils<S> & {
  readonly store: S & StoreCoreUtils<S>;
};
