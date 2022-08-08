import { CustomEventInterface } from "./listener";

export type Callback = () => void;

// 初始化数据的继承类型
export type State = Record<string, any>;

/**
 * @description 使用String作为hook取名后缀，是取于string theory
 * 弦理论-物理学理论，弦(string)作为终极微粒之意释意
 * 此处亦理解为每一个状态数据的终极状态数据元（单个独立的微数据元）
 */
export type StoreValueMapType<T extends State> = {
  subscribe: (onStoreChange: Callback) => Callback;
  getString: () => T[keyof T];
  setString: (val: T[keyof T]) => void;
  useString: () => T[keyof T];
};

export type StoreValueMap<T extends State> = Map<keyof StoreValueMapType<T>, StoreValueMapType<T>[keyof StoreValueMapType<T>]>;
export type StoreMap<T extends State> = Map<keyof T, StoreValueMap<T>>;

export type StoreHeartMapValueType<T extends State> = {
  // store内部的state数据对象（使用函数来维持数据获取最新数据值）
  getState: () => Map<keyof T, T[keyof T]>,
  // 重置(恢复)初始化数据（供resyView使用）
  resetState: Callback;
  // 订阅监听的事件类型
  listenerEventType: string | symbol;
  // 触发订阅监听的影响Set容器
  dispatchStoreEffectSet: Set<CustomEventInterface<T>>;
  // 触发订阅监听的变动影响
  dispatchStoreEffect: (effectState: Partial<T>, prevState: T, nextState: T) => void,
}

// 每一个resy生成的store的监听订阅对象、内部stateMap数据以及重置初始化数据的方法
export type StoreHeartMapType<T extends State> = Map<
  keyof StoreHeartMapValueType<T>,
  StoreHeartMapValueType<T>[keyof StoreHeartMapValueType<T>]
>;

// resy生成的store上挂载的更新方法
export type ResyUpdateType<T extends State> = {
  /**
   * resyUpdate
   * @description 最初是为了批量更新而创建的方法
   * 后完善来resy的批处理，而resyUpdate依然保留
   * 它的使用方式以及回调依然具有很好的代码编写能力
   *
   * @example A
   * store.resyUpdate({
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
   * store.resyUpdate(() => {
   *   store.count = 123;
   *   store.text = "updateText";
   * }, (state) => {
   *   console.log(state);
   * });
   */
  resyUpdate(
    state: Partial<T> | T | Callback,
    callback?: (nextState: T) => void,
  ): void;
}
