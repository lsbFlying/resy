import type { State, Listener, CustomEventListener, CustomEventListenerConstructor, EventsType } from "./model";

/**
 * created by liushanbao
 * @description 自定义监听事件的构造函数
 * @author liushanbao
 */
// tslint:disable-next-line:variable-name
const EventDispatcher = (function <S extends State>(this: CustomEventListener<S>) {
  this.events = new Map();
} as unknown) as CustomEventListenerConstructor<any>;

EventDispatcher.prototype.addEventListener = function<S extends State>(
  this: CustomEventListener<S>,
  type: string,
  listener: Listener<S>,
) {
  this.events.set(type as keyof S, listener as S[keyof S]);
}
EventDispatcher.prototype.removeEventListener = function(type: string | symbol) {
  this.events.delete(type);
}
EventDispatcher.prototype.dispatchEvent = function<S extends State>(
  this: CustomEventListener<S>,
  type: EventsType,
  effectState: Partial<S>,
  prevState: S,
  nextState: S,
) {
  this.events.get(type)?.(effectState, prevState, nextState);
}

export default EventDispatcher;
