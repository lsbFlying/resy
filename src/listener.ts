import type { State, Listener, CustomEventListener, CustomEventListenerConstructor } from "./model";

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
/**
 * @description resy销毁监听订阅的时候尽管实际上是移除了监听Set中的监听实例
 * 但是这里仍然建议移除监听的事件，即removeEventListener仍然需要
 * 是为了删除后腾出内存空间不占内存，避免"内存释放"的心智负担
 */
EventDispatcher.prototype.removeEventListener = function(type: string | symbol) {
  this.events.delete(type);
}
EventDispatcher.prototype.dispatchEvent = function<S extends State>(
  this: CustomEventListener<S>,
  type: number | string | symbol,
  effectState: Partial<S>,
  prevState: S,
  nextState: S,
) {
  this.events.get(type)?.(effectState, prevState, nextState);
}

export default EventDispatcher;
