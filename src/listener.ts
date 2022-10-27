import type { State, Listener, CustomEventListener, CustomEventListenerConstructor } from "./model";

/**
 * created by liushanbao
 * @description 自定义监听事件的构造函数
 * @author liushanbao
 */
const EventDispatcher = (function <T extends State>(this: CustomEventListener<T>) {
  this.events = {} as T;
} as unknown) as CustomEventListenerConstructor<any>;

EventDispatcher.prototype.addEventListener = function<T extends State>(this: CustomEventListener<T>, type: string, handle: Listener<T>) {
  this.events[type as keyof T] = handle as T[keyof T];
}
/**
 * 刚好也正是由于resy是销毁监听订阅的时候实际上是移除了监听Set中的监听实例
 * 所以这里也可以简化去除removeEventListener
 */
// EventDispatcher.prototype.removeEventListener = function(type: string | symbol) {
//   this.events[type] = undefined;
// }
EventDispatcher.prototype.dispatchEvent = function<T extends State>(
  this: CustomEventListener<T>,
  type: string,
  effectState: Partial<T>,
  prevState: T,
  nextState: T,
) {
  /**
   * 由于resy是销毁监听订阅的时候实际上是移除了监听Set中的监听实例
   * 所以这里原本作为单独使用的代码可以把if语句去掉直接执行
   * remove next code
   * ```code
   * if (!this.events[type]) return;
   * ```
   */
  this.events[type](effectState, prevState, nextState);
}

export default EventDispatcher;
