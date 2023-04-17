// @ts-ignore
import { unstable_batchedUpdates } from "react-platform";
import type { Callback } from "./model";

/**
 * 批处理的安全补包
 * @description 一个unstable_batchedUpdates的shim垫片
 */
export function batchUpdateShimRun(fn: Callback) { fn() }

/**
 * 批处理更新
 * @description React-v18中所有的更新以及是自动化批处理的了，但是unstable_batchedUpdates这个API它目前还仍然在18的版本中可以使用，
 * 但不保证未来会有去除这个非正式API的可能性，所以做一个垫片保证代码的安全稳健性，保证代码不出错
 *
 * 🌟legacy模式下：命中 unstable_batchedUpdates 时是异步，未命中 unstable_batchedUpdates 时是同步的
 * 🌟concurrent模式下：都是异步的
 */
export const batchUpdate = unstable_batchedUpdates || batchUpdateShimRun;

// 每一个resy生成的store具有的监听订阅处理的唯一标识key值
export const STORE_CORE_MAP_KEY = Symbol("storeCoreMapKey");

// 订阅监听事件类型
export const EVENT_TYPE = Symbol("eventType");

// useStore的key值，获取storeMap的代理key值
export const USE_STORE_KEY = Symbol("useStoreKey");

// useConciseStore的key值，获取storeMap的代理key值
export const USE_CONCISE_STORE_KEY = Symbol("useConciseStoreKey");

// develop environment
export const _DEV_ = process.env.NODE_ENV !== "production";
