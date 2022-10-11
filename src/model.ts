import { CustomEventListener, Listener } from "./listener";
import { storeCoreMapKey, storeMapKey, stateMapKey, stateKey, unmountClearKey } from "./static";

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

/**
 * StoreCoreMap的数据值类型，作为createStore的核心Map接口类型
 * 具备获取内部state数据对象、重置数据、订阅监听等功能
 */
export interface StoreCoreMapValue<T extends State> {
  // store内部的state数据对象（使用函数来维持数据获取最新数据值）
  getState: () => Map<keyof T, T[keyof T]>,
  // 重置(恢复)初始化数据（供pureView使用）
  resetState: Callback;
  // 订阅监听的事件类型
  listenerEventType: string | symbol;
  // 触发订阅监听的影响Set容器
  dispatchStoreEffectSet: Set<CustomEventListener<T>>;
  // 触发订阅监听的变动影响
  dispatchStoreEffect: (effectState: Partial<T>, prevState: T, nextState: T) => void,
}

// 每一个resy生成的store的监听订阅对象、内部stateMap数据以及重置初始化数据的方法
export type StoreCoreMapType<T extends State> = Map<
  keyof StoreCoreMapValue<T>,
  StoreCoreMapValue<T>[keyof StoreCoreMapValue<T>]
>;

// setState的函数更新处理
export interface StateFunc {
  (): void;
}

export type ExternalMapValue<T extends State> = SetState<T> & Subscribe<T> & {
  [storeCoreMapKey]: StoreCoreMapType<T>;
  [stateMapKey]: Map<keyof T, T[keyof T]>,
  [storeMapKey]: StoreMap<T>,
  [stateKey]: T,
  [unmountClearKey]: true | false,
}

export type ExternalMapType<T extends State> = Map<
  keyof ExternalMapValue<T>,
  ExternalMapValue<T>[keyof ExternalMapValue<T>]
>;

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
 * }, (state) => {
 *   // state：最新的数据值
 *   // 可以理解为this.setState中的回调中的this.state
 *   // 同时这一点也弥补了：
 *   // hook组件中setState后只能通过useEffect来获取最新数据的方式
 *   console.log(state);
 * });
 * @example B
 * store.setState(() => {
 *   store.count = 123;
 *   store.text = "updateText";
 * }, (state) => {
 *   console.log(state);
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
