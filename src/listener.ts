import { EffectState, ListenerHandle, ResyType } from "./model";

export function EventDispatcher(this: any) {
  this.events = {};
}
EventDispatcher.prototype.addEventListener = function <T>(this: any, type: string, handle: ListenerHandle<T>) {
  this.events[type] = handle;
}
EventDispatcher.prototype.removeEventListener = function (type: string | symbol) {
  this.events[type] = undefined;
}
EventDispatcher.prototype.dispatchEvent = function <T extends ResyType>(
  this: any,
  type: string,
  effectState: EffectState<T>,
  prevState: T,
  nextState: T,
) {
  if (!this.events[type]) return;
  this.events[type](effectState, prevState, nextState);
}
