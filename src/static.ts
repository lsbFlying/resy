// @ts-ignore
// eslint-disable-next-line import/no-unresolved
import { unstable_batchedUpdates } from "react-platform";
import type { Callback } from "./types";

/**
 * 批处理的安全补包
 * @description 一个unstable_batchedUpdates的shim垫片
 */
export const batchUpdateShimRun = (fn: Callback) => fn();

/**
 * 批处理更新
 * @description React-v18中所有的更新以及是自动化批处理的了，但是unstable_batchedUpdates这个API它目前还仍然在18的版本中可以使用，
 * 但不保证未来会有去除这个非正式API的可能性，所以做一个垫片保证代码的安全稳健性，保证代码不出错
 * safe:
 * 增加一个unstable_batchedUpdates的shim垫片，
 * 防止react后续版本可能移除该api
 * 以保证代码的安全执行
 */
export const batchUpdate = unstable_batchedUpdates || batchUpdateShimRun;

// 处理view连接store的唯一标识key值
export const VIEW_CONNECT_STORE_KEY = Symbol("storeViewMapKey");

// resy的内部特殊标识
export const REGENERATIVE_SYSTEM_KEY = Symbol("regenerativeSystemKey");

const NODE_ENV = process.env.NODE_ENV;

if (!NODE_ENV) console.error("NODE_ENV not set");

export const __DEV__ = NODE_ENV === "development";

// class组件连接store的属性symbol符
export const CONNECT_SYMBOL_KEY = Symbol("connectSymbolKey");

// useStore的key值，获取storeMap的代理key值
export const USE_STORE_KEY = Symbol("useStoreKey");

// class组件内部的state数据引用的集合key
export const CLASS_STATE_REF_SET_KEY = Symbol("classStateRefSetKey");

// class组件内部使用的store的set集合的key
export const STORES_KEY = Symbol("storesKey");

// class的unmountHandle处理key
export const CLASS_UNMOUNT_HANDLE_KEY = Symbol("classUnmountHandleKey");

// class的Fn初始化重置恢复state处理key
export const CLASS_FN_INITIAL_HANDLE_KEY = Symbol("classFnInitialHandleKey");
