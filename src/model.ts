import { storeCoreMapKey, useStoreKey } from "./static";

export type Callback = () => void;

// 初始化数据的继承类型
export type State = Record<string, any>;

/**
 * @description resy的store接口类型
 */
export type StoreMapValueType<T extends State> = {
  subscribe: (onStoreChange: Callback) => Callback;
  getSnapshot: () => T[keyof T];
  setSnapshot: (val: T[keyof T]) => void;
  useSnapshot: () => T[keyof T];
};

export type StoreMapValue<T extends State> = Map<
  keyof StoreMapValueType<T>,
  StoreMapValueType<T>[keyof StoreMapValueType<T>]
>;
// createStore的storeMap数据类型
export type StoreMap<T extends State> = Map<keyof T, StoreMapValue<T>>;

// 订阅事件的监听回调函数类型
export type Listener<T extends State> = (
  effectState: Partial<Omit<T, keyof SetState<T> | keyof Subscribe<T>>>,
  prevState: Omit<T, keyof SetState<T> | keyof Subscribe<T>>,
  nextState: Omit<T, keyof SetState<T> | keyof Subscribe<T>>,
) => void;

// 自定义订阅监听函数接口类型
export interface CustomEventListener<T extends State> {
  // 监听事件的合集对象
  events: T;
  addEventListener(type: string | symbol, handle: Listener<T>): void;
  dispatchEvent(
    type: string | symbol,
    effectState: Partial<T>,
    prevState: T,
    nextState: T,
  ): void;
  /**
   * 本身EventDispatcher可以单独使用，在结合resy是销毁监听订阅的时候实际上是移除了监听Set中的监听实例
   * 所以subscribe这里可以不用多余使用removeEventListener，直接移除实例即可
   * 所以这里也是直接简化去除removeEventListener
   */
  // removeEventListener(type: string | symbol): void;
}

// 自定义监听事件的构造函数接口类型
export interface CustomEventListenerConstructor<T extends State> {
  // 声明可以作为构造函数调用
  new (): CustomEventListener<T>;
  // 声明prototype，支持后续修改prototype（这里主要是构造函数时定义了原型链上面的方法，后续不需要更改）
  prototype: CustomEventListener<T>;
}

/**
 * StoreCoreMap的数据值类型，作为createStore的核心Map接口类型
 * 具备获取内部state数据对象、重置数据、订阅监听等功能
 */
export interface StoreCoreMapValue<T extends State> {
  // store内部的state数据对象（使用函数来维持数据获取最新数据值）
  getState: () => Map<keyof T, T[keyof T]>;
  // 设置stateMap部分字段数据值（主要是给useStore的初始化值是某些hooks返回值赋值使用的）
  setHookFieldsValue: (hookInitialState: { [key in keyof T]: T[keyof T] }) => void;
  // 重置(恢复)初始化数据（供view使用）
  resetState: Callback;
  // 订阅监听的事件类型
  listenerEventType: string | symbol;
  // 触发订阅监听的影响Set容器
  dispatchStoreSet: Set<CustomEventListener<T>>;
  // 触发订阅监听的变动影响
  dispatchStoreEffect: (effectState: Partial<T>, prevState: T, nextState: T) => void;
}

// 每一个resy生成的store的监听订阅对象、内部stateMap数据以及重置初始化数据的方法
export type StoreCoreMapType<T extends State> = Map<
  keyof StoreCoreMapValue<T>,
  StoreCoreMapValue<T>[keyof StoreCoreMapValue<T>]
>;

export type ExternalMapValue<T extends State> = SetState<T> & Subscribe<T> & {
  [storeCoreMapKey]: StoreCoreMapType<T>;
  [useStoreKey]: object;
}

export type ExternalMapType<T extends State> = Map<
  keyof ExternalMapValue<T>,
  ExternalMapValue<T>[keyof ExternalMapValue<T>]
>;

// setState的函数更新处理
export interface StateFunc {
  (): void;
}

/**
 * @description setState —————— resy生成的store上挂载的更新方法
 *
 * 1、resy需要setState最主要的原因是需要setState的回调功能
 * 它的回调函数的参数是最新的数据，或者在回调函数中通过store.来获取最新数据
 * 因为resy的更新是异步的，于是需要同步获取数据时就需要setState的回调
 * 它相当于class组件的setState的回调
 *
 * 2、setState本身的使用方式在编码的时候具备很好的读写能力，
 * 扩展运算符的对象数据更新的便捷、函数入参的循环更新的宽泛，都让setState具备更强的生命力
 *
 * 3、setState是挂载在每一个resy生成的store数据上面的方法
 *
 * @example A
 * store.setState({
 *   count: 123,
 *   text: "updateText",
 * }, (nextState) => {
 *   // nextState：最新的数据值
 *   // 可以理解为this.setState中的回调中的this.state
 *   // 同时这一点也弥补了：
 *   // hook组件中setState后只能通过useEffect来获取最新数据的方式
 *   console.log(nextState);
 * });
 * @example B
 * store.setState(() => {
 *   store.count = 123;
 *   store.text = "updateText";
 * }, (nextState) => {
 *   console.log(nextState);
 * });
 */
export type SetState<T extends State> = Readonly<{
  setState(
    state: Partial<T> | T | StateFunc,
    callback?: (nextState: T) => void,
  ): void;
}>;

// resy的订阅监听的取消返回函数
export interface Unsubscribe {
  (): void
}

// resy的订阅监听
export type Subscribe<T extends State> = Readonly<{
  subscribe(
    listener: Listener<T>,
    stateKeys?: (keyof T)[],
  ): Unsubscribe;
}>;

// 将resy生成的store容器数据映射挂载到组件props的state属性上
export type MapStateToProps<S extends State, P extends State = {}> = P & {
  state: S;
}

// resy的调度类型接口
export interface Scheduler<T = State> {
  add<T>(task: Callback, key: keyof T, val: T[keyof T]): Promise<void>;
  flush(): void;
  getTaskDataMap(): Map<keyof T, T[keyof T]>;
}
