import type { Callback, ValueOf, PrimitiveState, MapType } from "../types";
import type { Subscribe } from "../subscribe/types";
import type { StoreViewMapType } from "../view/types";
import type { ConnectType, ClassUnmountHandleType, ClassFnInitialHandleType } from "../connect/types";
import {
  REGENERATIVE_SYSTEM_KEY, VIEW_CONNECT_STORE_KEY,
  USE_STORE_KEY, CLASS_STATE_REF_SET_KEY,
} from "../static";

/**
 * @description createStore该API第二个参数配置项
 */
export type StoreOptions = Readonly<{
  /**
   * @description 1、该参数主要是为了在某模块mount初始化阶段自动重置数据的，
   * 如遇到登录信息、主题等这样的全局数据而言才会设置为false，
   * 这样可以使得生成的loginStore或者themeStore系统的全局生效
   * 2、对象接口式的写法是为了兼容未来可能的未知的配置功能的增加
   * @default true
   */
  unmountRestore?: boolean;
  /**
   * 供useConciseState钩子使用的配置（内部使用，外部不建议使用）
   * @default undefined
   */
  __useConciseStateMode__?: boolean;
}>;

/** 初始化参数禁用的key类型 */
export type InitialStateForbiddenKeys =
  | "setState"
  | "syncUpdate"
  | "subscribe"
  | "restore"
  | "setOptions"
  | "useStore"
  | "store";  // store是useConciseState的属性

/**
 * @description resy的storeMap接口类型
 * subscribeOriginState与getOriginState是useSyncExternalStore参数接口
 * 其中subscribeOriginState的onOriginStateChange参数回调包含数据更新操作
 * 将这些数据更新操作的函数储存在某个既定的Set中，
 * 然后需要更新的时候在batchUpdate内部forEach循环批量更新即可
 * getOriginState对应到useSyncExternalStore的getSnapshot
 */
export type StoreMapValueType<S extends PrimitiveState> = {
  // 当前源数据的状态变化事件的订阅，useSyncExternalStore的订阅
  subscribeOriginState: (onOriginStateChange: Callback) => Callback;
  // 获取当前源数据(单个数据属性状态)
  getOriginState: () => ValueOf<S>;
  /**
   * @description 使用当前源数据，即useSyncExternalStore的useSnapshot，
   * 可以简单理解为useState的效果，具备驱动页面更新渲染的能力。
   */
  useOriginState: () => ValueOf<S>;
  /**
   * 更新源数据的更新器
   * @description 相比放在全局一个更新队列中把每一个源数据属性队列中的方式能极大程度的减缓数据过大后大致的全局更新队列的冗余庞大
   * 显然这种方式更减轻内存负担，同时即更即取即消的处理方式对于运行内存以及运算优势更加迅速
   */
  updater: Callback;
};

export type StoreMapValue<S extends PrimitiveState> = MapType<StoreMapValueType<S>>;
// createStore的storeMap数据类型
export type StoreMap<S extends PrimitiveState> = Map<keyof S, StoreMapValue<S>>;

export type ExternalMapValue<S extends PrimitiveState> = StoreUtils<S>
  & ConnectType
  & ClassUnmountHandleType
  & ClassFnInitialHandleType
  & {
  [VIEW_CONNECT_STORE_KEY]: StoreViewMapType<S>;
  [REGENERATIVE_SYSTEM_KEY]: symbol;
  [USE_STORE_KEY]: object;
  readonly store: Store<S>;
};

// 扩展map的类型
export type ExternalMapType<S extends PrimitiveState> = MapType<ExternalMapValue<S>>;

/**
 * 更新参数的数据类型
 * @description 兼容null是出于后端最常用返回的数据格式null居多的考虑
 */
export type State<S extends PrimitiveState> = Partial<S> | S | null;

// class的this对象简易类型
export type ClassThisPointerType<S extends PrimitiveState> = PrimitiveState & Readonly<{
  setState(state: State<S>): void;
}> & {
  [CLASS_STATE_REF_SET_KEY]: Set<keyof S>;
};

/** setState 更新数据 */
export type SetState<S extends PrimitiveState> = Readonly<{
  /**
   * @param state 更新的参数
   * @param callback 更新后的回调函数
   */
  setState(
    state: State<S> | StateFnType<S>,
    callback?: StateCallback<S>,
  ): void;
}>;

/**
 * setState与syncUpdate的函数更新类型
 * @description prevState的存在是有必要的，在复杂的业务更新逻辑与事件循环中，
 * 能够通过简单的同步代码直接获取prevState之前的同步状态是很舒畅简约的设定
 */
export type StateFnType<S extends PrimitiveState> = (prevState: Readonly<S>) => State<S>;

/**
 * setState、syncUpdate、restore的回调函数的类型
 * @description 回调中nextState参数的存在是必要的，在复杂事件周期过程中，
 * 虽然通过store获取数据可以获取最新的值，但是事件周期的复杂性会使最新的数据来源不可控，
 * 很难追溯数据变化的来源，而此刻有nextState可以同步获取当前的同步状态是简约方便的设计
 */
export type StateCallback<S extends PrimitiveState> = (nextState: Readonly<S>) => void;

// setState、syncUpdate、restore的回调执行栈的元素类型
export type StateCallbackItem<S extends PrimitiveState> = {
  // 当前这一句更新代码更新的state状态数据
  nextState: S;
  callback: StateCallback<S>;
};

/** 同步更新 */
export type SyncUpdate<S extends PrimitiveState> = Readonly<{
  /**
   * @description 同步更新
   * 为了react的更新机制不适应在异步中执行的场景
   * 该场景为在异步中更新受控input类输入框的value值
   * 会导致输入不了英文以外的语言文字
   * @param state
   * @param callback
   */
  syncUpdate(
    state: State<S> | StateFnType<S>,
    callback?: StateCallback<S>,
  ): void;
}>;

/**
 * @description 重置、恢复初始化状态，具备更新渲染效应，有一定的业务需求必要性
 */
export type Restore<S extends PrimitiveState> = Readonly<{
  /**
   * @param callback
   */
  restore(callback?: StateCallback<S>): void;
}>;

/**
 * 设置createStore的options参数
 * @description 之所以可以允许改变StoreOptions，是因为业务场景的需要
 * 同时也是开放通道灵活开发，因为本身createStore的静态执行是一种限制
 * 如果需要在某种场景下的突然变动而无法使得静态参数设置变得可更改是一种束缚
 * 比如我有一个store初始场景是不需要unmountRestore为false，即常规下不需要永存状态信息
 * 但是突然因为业务场景的需求需要变更为我需要永存状态信息以便于在下次回到该store的运用情况的时候
 * 还能仍然保持之前的数据状态信息，这种情况是有必要的，主要是不想让StoreOptions成为一种限制
 * 应该使得其作为一种辅助，但一般而言StoreOptions本身的配置能够符合且满足绝大多数场景
 * 所以SetOptions的使用场景还是较少概率的。
 */
export type SetOptions = Readonly<{
  setOptions(options: StoreOptions): void;
}>;

/** store.useStore() 等价于 useStore(store) 的使用 */
export type UseStore<S extends PrimitiveState> = Readonly<{
  useStore(): S & StoreCoreUtils<S> & SetOptions;
}>;

/** store的一些核心的工具方法类型 */
export type StoreCoreUtils<S extends PrimitiveState> = SetState<S> & SyncUpdate<S> & Restore<S> & Subscribe<S>;

/** store的工具方法类型 */
export type StoreUtils<S extends PrimitiveState> = StoreCoreUtils<S> & SetOptions & UseStore<S>;

/** createStore返回的store类型 */
export type Store<S extends PrimitiveState> = S & StoreUtils<S>;

/** 给初始化参数initialState的函数thisType类型使用的初始化store的this类型 */
export type InitialStore<S extends PrimitiveState> = {
  [K in keyof S]: K extends InitialStateForbiddenKeys ? never : S[K];
} & StoreCoreUtils<S> & SetOptions;

/** InitialState的初始化禁用的参数类型 */
export type PrimateForbiddenType =
  | number
  | string
  | null
  | Symbol
  | boolean
  | Set<any>
  | Map<any, any>
  | Array<any>
  | WeakSet<any>
  | WeakMap<any, any>
  | WeakRef<any>;

/** 具备this类型指向识别的参数类型 */
export type StateWithThisType<S extends PrimitiveState> = S extends PrimateForbiddenType
  ? never
  : S & {
    [K in keyof S]: K extends InitialStateForbiddenKeys
      ? never
      : S[K];
  } & ThisType<InitialStore<S>>;

/** 初始化数据类型 */
export type InitialState<S extends PrimitiveState> = (() => StateWithThisType<S>) | StateWithThisType<S>;

// 对应整个store的数据引用标记的计数器的map类型
export type StateRefCounterMapType = MapType<{
  counter: number;
}>;
