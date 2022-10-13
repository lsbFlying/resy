import { State, SetState, Subscribe } from "./model";

// 订阅事件的监听回调函数类型
export type Listener<T extends State> = (
  effectState: Partial<Omit<T, keyof SetState<T> | keyof Subscribe<T>>>,
  prevState: Omit<T, keyof SetState<T> | keyof Subscribe<T>>,
  nextState: Omit<T, keyof SetState<T> | keyof Subscribe<T>>,
) => void;

// 自定义订阅监听函数接口类型
export interface CustomEventListener<T extends State> {
  addEventListener(type: string | symbol, handle: Listener<T>): void,
  dispatchEvent(
    type: string | symbol,
    effectState: Partial<T>,
    prevState: T,
    nextState: T,
  ): void,
  /**
   * 本身EventDispatcher可以单独使用，在结合resy时销毁监听订阅的时候实际上是移除了监听Set中的监听实例
   * 所以subscribe这里可以不用多余使用removeEventListener，直接移除实例即可
   */
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
EventDispatcher.prototype.addEventListener = function<T extends State>(this: any, type: string, handle: Listener<T>) {
  this.events[type] = handle;
}
EventDispatcher.prototype.removeEventListener = function(type: string | symbol) {
  this.events[type] = undefined;
}
EventDispatcher.prototype.dispatchEvent = function<T extends State>(
  this: any,
  type: string,
  effectState: Partial<T>,
  prevState: T,
  nextState: T,
) {
  if (!this.events[type]) return;
  this.events[type](effectState, prevState, nextState);
}
