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
 * @description setState —————— 更新数据的函数，主要是为了批量更新
 *
 * 1、resy需要setState最主要的原因是setState本身的使用方式在编码的时候具备很好的读写能力，
 * 支持扩展运算符的对象数据更新的便捷、函数入参的循环更新的宽泛，都让setState具备更强的生命力
 *
 * 2、从V4.0.4开始setState移除了回调函数的功能，因为setState本身是同步更新数据的，
 * setState执行完成之后直接通过store可以读取获取到最新数据值
 * 所以在考虑再三之后决定简化使用移除了callback
 *
 * @example A
 * store.setState({
 *   count: 123,
 *   text: "updateText",
 * });
 *
 * @description 函数入参方式主要是为了某些复杂的更新逻辑，比如在循环中更新的批量化
 * @example B
 * store.setState(() => {
 *   store.count = 123;
 *   store.text = "updateText";
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
export interface Scheduler<T extends State = {}> {
  /** 新增直接更新数据的key/value以及相应的任务函数 */
  add(task: Callback, key: keyof T, val: T[keyof T]): Promise<void>;
  /** 冲刷任务数据与任务队列 */
  flush(): void;
  /** 获取任务数据与任务队列 */
  getTask(): {
    taskDataMap: Map<keyof T, T[keyof T]>,
    taskQueueMap: Map<string | number | symbol, Callback>,
  };
}
