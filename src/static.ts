// @ts-ignore
import { unstable_batchedUpdates } from "react-platform";
import { Callback } from "./model";

/**
 * batchUpdateShimRun
 * @description 一个unstable_batchedUpdates的shim垫片
 */
export function batchUpdateShimRun(fn: Callback) { fn() }

/**
 * React-v18中所有的更新以及是自动化批处理的了，但是unstable_batchedUpdates这个API它目前还仍然在18的版本中可以使用，
 * 但不保证未来会有去除这个非正式API的可能性，所以做一个垫片保证代码的安全稳健性，保证代码不出错
 */
export const batchUpdate = unstable_batchedUpdates || batchUpdateShimRun;

/**
 * 每一个resy生成store的监听订阅对象、内部state数据的唯一标识key值
 * 以及resy的store内部一些相关数据的获取key值
 */
export const storeCoreMapKey = "react-state-easy-store-core-map-key";
export const stateMapKey = "react-state-easy-state-map-key";
export const storeMapKey = "react-state-easy-store-map-key";
export const stateKey = "react-state-easy-state-key";
export const unmountClearKey = "react-state-easy-unmount-clear-key";

// pureView中获取nextState的整个Map数据的key
export const pureViewNextStateMapKey = Symbol("resyPureViewNextStateMapKey");
