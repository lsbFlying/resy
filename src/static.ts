import ReactDOM from "react-dom";
import { Callback } from "./model";

/**
 * batchUpdateShimRun
 * @description 一个unstable_batchedUpdates的shim垫片
 */
export function batchUpdateShimRun(fn: Callback) { fn() }

/**
 * React-v18中所有的更新以及是自动化批处理的了，但是unstable_batchedUpdates这个API它目前还仍然在18的版本中可以使用，
 * 但不保证未来会有去除这个非正式API的可能性，所以做一个垫片保证代码的安全稳健性
 */
export const batchUpdate = ReactDOM.unstable_batchedUpdates || batchUpdateShimRun;

// 某一个store的监听订阅对象的唯一标识key值
export const storeListenerKey = Symbol("resyStoreListenerSymbolKey");

// 获取同步数据的key值
export const getResySyncStateKey = Symbol("getResySyncStateSymbolKey");
