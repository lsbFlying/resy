import type { PrimitiveState } from "../types";
import type { StoreCoreUtils, SetOptions } from "../store/types";
import { CONNECT_SYMBOL_KEY } from "../static";

/** 连接store的函数类型 */
export type ConnectStoreType = {
  connectStore<S extends PrimitiveState>(store: S): ClassStoreType<S>;
};

/** class连接store后的数据类型 */
export type ClassStoreType<S extends PrimitiveState> = S & StoreCoreUtils<S> & SetOptions;

/** 供class组件的基础类ComponentWithStore使用 */
export type ConnectType = {
  [CONNECT_SYMBOL_KEY]?<S extends PrimitiveState>(): ClassStoreType<S>;
};
