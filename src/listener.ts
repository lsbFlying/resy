import type { State, Listener, CustomEventListener, CustomEventListenerConstructor } from "./model";

/**
 * created by liushanbao
 * @description 自定义监听事件的构造函数
 * @author liushanbao
 */
// tslint:disable-next-line:variable-name
const EventDispatcher = (function <S extends State>(this: CustomEventListener<S>) {
  this.events = {} as S;
} as unknown) as CustomEventListenerConstructor<any>;

EventDispatcher.prototype.addEventListener = function<S extends State>(
  this: CustomEventListener<S>,
  type: string,
  listener: Listener<S>,
) {
  this.events[type as keyof S] = listener as S[keyof S];
}
/**
 * @description resy销毁监听订阅的时候尽管实际上是移除了监听Set中的监听实例
 * 但是这里仍然建议移除监听的事件，即removeEventListener仍然需要
 * 是为了删除后腾出内存空间不占内存，避免"内存释放"的心智负担
 * todo 下个版本优化上述处理
 */
// EventDispatcher.prototype.removeEventListener = function(type: string | symbol) {
//   this.events[type] = undefined;
// }
EventDispatcher.prototype.dispatchEvent = function<S extends State>(
  this: CustomEventListener<S>,
  type: string,
  effectState: Partial<S>,
  prevState: S,
  nextState: S,
) {
  /**
   * @description 由于resy是销毁监听订阅的时候实际上是移除了监听Set中的监听实例
   * 所以这里原本作为单独使用的代码可以把if语句去掉直接执行
   * remove next code
   * ```code
   * if (!this.events[type]) return;
   * ```
   */
  this.events[type](effectState, prevState, nextState);
}

export default EventDispatcher;
