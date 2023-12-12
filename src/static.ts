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
 * mode:
 * 🌟legacy模式下：命中 unstable_batchedUpdates 时是异步，未命中 unstable_batchedUpdates 时是同步的
 * 🌟concurrent模式下：都是异步的
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
