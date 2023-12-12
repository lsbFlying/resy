import type { Callback, PrimitiveState } from "../types";

/** resy的订阅监听的取消返回函数 */
export type Unsubscribe = Callback;

/** 订阅监听函数的参数类型 */
export type ListenerParams<S extends PrimitiveState> = {
  effectState: Partial<S>;
  nextState: S;
  prevState: S;
};

/** 订阅事件的监听回调函数类型 */
export type Listener<S extends PrimitiveState> = (data: ListenerParams<S>) => void;

/** resy的订阅监听类型 */
export type Subscribe<S extends PrimitiveState> = Readonly<{
  /**
   * subscribe
   * @description 监听订阅，类似addEventListener，但是这里对应的数据的变化监听订阅
   * subscribe的存在是必要的，它的作用并不类比于useEffect，
   * 而是像subscribe或者addEventListener的效果，监听订阅数据的变化
   * 具备多数据订阅监听的能力
   * @param listener 监听订阅的回调函数
   * @param stateKeys 监听订阅的具体的某一个store容器的某些数据变化，如果为空则默认监听store的任何一个数据的变化
   * @return unsubscribe 返回取消监听的函数
   */
  subscribe(
    listener: Listener<S>,
    stateKeys?: (keyof S)[],
  ): Unsubscribe;
}>;
