import { ResyUpdateType, State } from "./model";

// 订阅事件的监听回调函数类型
export type ListenerHandle<T extends State> = (
  effectState: Partial<Omit<T, keyof ResyUpdateType<T>>>,
  prevState: Omit<T, keyof ResyUpdateType<T>>,
  nextState: Omit<T, keyof ResyUpdateType<T>>,
) => void;

// 自定义订阅监听函数接口类型
export interface CustomEventInterface<T extends State> {
  addEventListener<T>(type: string | symbol, handle: ListenerHandle<T>): void,
  dispatchEvent(
    type: string | symbol,
    effectState: Partial<T>,
    prevState: T,
    nextState: T,
  ): void,
  removeEventListener(type: string | symbol): void,
}

/**
 * created by liushanbao
 * @description 自定义监听事件
 * @author liushanbao
 */
export function EventDispatcher(this: any) {
  this.events = {};
}
EventDispatcher.prototype.addEventListener = function <T extends State>(this: any, type: string, handle: ListenerHandle<T>) {
  this.events[type] = handle;
}
EventDispatcher.prototype.removeEventListener = function (type: string | symbol) {
  this.events[type] = undefined;
}
EventDispatcher.prototype.dispatchEvent = function <T extends State>(
  this: any,
  type: string,
  effectState: Partial<T>,
  prevState: T,
  nextState: T,
) {
  if (!this.events[type]) return;
  this.events[type](effectState, prevState, nextState);
}
