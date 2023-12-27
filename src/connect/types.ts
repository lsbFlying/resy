import type { PrimitiveState } from "../types";
import type { StoreCoreUtils, SetOptions } from "../store/types";
import { CLASS_UNMOUNT_HANDLE_KEY, CONNECT_SYMBOL_KEY } from "../static";

/**
 * Function types for connecting stores
 * Performs some action. This method should not be overridden in subclasses.
 * @method
 * @description This is an important method that is core to the functionality of this class.
 */
export type ConnectStoreType = {
  connectStore<S extends PrimitiveState>(store: S): ClassStoreType<S>;
};

/** class连接store后的数据类型 */
export type ClassStoreType<S extends PrimitiveState> = S & StoreCoreUtils<S> & SetOptions;

/** 供class组件的基础类ComponentWithStore使用 */
export type ConnectType = {
  [CONNECT_SYMBOL_KEY]<S extends PrimitiveState>(): ClassStoreType<S>;
};

// class组件卸载后执行的方法的类型
export type ClassUnmountHandleType = {
  [CLASS_UNMOUNT_HANDLE_KEY](): void;
}
