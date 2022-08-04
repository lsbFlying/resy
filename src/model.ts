import { resy } from "./index";

export type Callback = () => void;

// 初始化数据的继承类型
export type State = Record<string, any>;

/**
 * @description 使用String作为hook取名后缀，是取于string theory
 * 弦理论-物理学理论，弦(string)作为终极微粒之意释意
 * 此处亦理解为每一个状态数据的终极状态数据元（单个独立的微数据元）
 */
export type StoreValueMapType<T> = {
  subscribe: (onStoreChange: Callback) => Callback;
  getString: () => T[keyof T];
  setString: (val: T[keyof T]) => void;
  useString: () => T[keyof T];
};

export type StoreValueMap<T> = Map<keyof StoreValueMapType<T>, StoreValueMapType<T>[keyof StoreValueMapType<T>]>;
export type StoreMap<T> = Map<keyof T, StoreValueMap<T>>;

export type ResyStateType = Omit<ReturnType<typeof resy>, "resyUpdate">;

// 订阅事件的监听回调函数类型
export type ListenerHandle<T extends ResyStateType> = (
  effectState: Partial<Omit<T, keyof ResyUpdateType<T>>>,
  prevState: Omit<T, keyof ResyUpdateType<T>>,
  nextState: Omit<T, keyof ResyUpdateType<T>>,
) => void;

// 自定义订阅监听函数接口类型
export interface CustomEventInterface<T extends ResyStateType> {
  addEventListener<T>(type: string | symbol, handle: ListenerHandle<T>): void,
  dispatchEvent(
    type: string | symbol,
    effectState: Partial<T>,
    prevState: T,
    nextState: T,
  ): void,
  removeEventListener(type: string | symbol): void,
}

export type StoreHeartMapValueType<T> = {
  // store内部的state数据对象（使用函数来维持数据获取最新数据值）
  getState: () => Map<keyof T, T[keyof T]>,
  // 重置(恢复)初始化数据（供resyView使用）
  resetState: Callback;
  // 订阅监听的事件类型
  listenerEventType: string | symbol;
  // 触发订阅监听的影响Set容器
  dispatchStoreEffectSet: Set<CustomEventInterface<any>>;
  // 触发订阅监听的变动影响
  dispatchStoreEffect: (effectState: Partial<T>, prevState: T, nextState: T) => void,
}

// 每一个resy生成的store的监听订阅对象、内部stateMap数据以及重置初始化数据的方法
export type StoreHeartMapType<T> = Map<
  keyof StoreHeartMapValueType<T>,
  StoreHeartMapValueType<T>[keyof StoreHeartMapValueType<T>]
>;

// resy生成的store上挂载的更新方法
export type ResyUpdateType<T extends ResyStateType> = {
  resyUpdate(
    state: Partial<T> | T | Callback,
    callback?: (nextState: T) => void,
  ): void;
}
