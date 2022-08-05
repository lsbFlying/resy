import { ListenerHandle, State } from "./model";

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
