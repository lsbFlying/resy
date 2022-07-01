import { resy } from "./index";

export type Callback = () => void;

// 初始化数据的继承类型
export type State = Record<string, any>;

/**
 * @description 使用String作为hook取名后缀，是取于string theory（弦理论-物理学理论，弦-终极微粒）之处，
 * 此处亦理解为每一个状态数据的终极状态数据元（单个独立的微数据元）
 */
export type Store<T> = {
  [K in keyof T]: {
    subscribe: (onStoreChange: Callback) => Callback;
    getString: () => T[K];
    setString: (val: T[K]) => void;
    useString: () => T[K];
  };
};

export type ResyType = ReturnType<typeof resy>;

// 订阅事件的回调的当前变化的数据
export type EffectState<T extends ResyType> = {
  [K in keyof T]: any;
}

// 订阅事件的监听回调函数类型
export type ListenerHandle<T extends ResyType> = (
  effectState: EffectState<T>,
  prevState: T,
  nextState: T,
) => void;

// 自定义订阅监听函数接口类型
export interface CustomEventInterface<T extends ResyType> {
  addEventListener<T>(type: string | symbol, handle: ListenerHandle<T>): void,
  dispatchEvent(
    type: string | symbol,
    effectState: EffectState<T>,
    prevState: T,
    nextState: T,
  ): void,
  removeEventListener(type: string | symbol): void,
}

// 每一个store的监听订阅对象
export type StoreListener = {
  listenerEventType: string | symbol;
  dispatchStoreEffectSet: Set<CustomEventInterface<any>>;
  dispatchStoreEffect: <T extends State>(effectState: EffectState<T>, prevState: T, nextState: T) => void,
};
