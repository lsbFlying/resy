import {
  VIEW_CONNECT_STORE_KEY, USE_CONCISE_STORE_KEY, USE_STORE_KEY, REGENERATIVE_SYSTEM_KEY,
} from "./static";

// 普通意义上的回调函数类型
export type Callback = () => void;

/**
 * @description 初始化数据的原始继承类型，目前没有想到键为symbol的状态使用场景，
 * 且支持symbol的键数据状态场景较为复杂，所以暂时不予支持symbol类型的键
 */
export type PrimitiveState = Record<number | string, any>;

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
};

export type StoreMapValue<S extends PrimitiveState> = MapType<StoreMapValueType<S>>;
// createStore的storeMap数据类型
export type StoreMap<S extends PrimitiveState> = Map<keyof S, StoreMapValue<S>>;

export type ListenerParams<S extends PrimitiveState> = {
  effectState: Partial<S>;
  nextState: S;
  prevState: S;
};

// 订阅事件的监听回调函数类型
export type Listener<S extends PrimitiveState> = (data: ListenerParams<S>) => void;

/**
 * @description StoreViewMap的数据值类型，作为view这个api的核心Map接口类型
 * 具备处理store的重置数据、以及获取最新state数据等相关处理功能
 */
export interface StoreViewMapValue<S extends PrimitiveState> {
  // store内部的stateMap数据对象
  getStateMap: MapType<S>;
  // view卸载检查重置数据
  viewUnmountRestore: Callback;
  // view初始化刷新恢复（createStore的initialState是函数的情况下）
  viewInitialStateFnRestore: Callback;
  // view的props数据使用方式的数据生命周期与store关联同步
  viewConnectStore: () => Unsubscribe;
}

// 供view使用的核心连接容器Map，包括处理内部stateMap数据以及重置初始化数据的方法
export type StoreViewMapType<S extends PrimitiveState> = MapType<StoreViewMapValue<S>>;

export type ExternalMapValue<S extends PrimitiveState> = StoreUtils<S> & {
  [VIEW_CONNECT_STORE_KEY]: StoreViewMapType<S>;
  [USE_STORE_KEY]: object;
  [USE_CONCISE_STORE_KEY]: object;
  [REGENERATIVE_SYSTEM_KEY]: symbol;
};

// 扩展map的类型
export type ExternalMapType<S extends PrimitiveState> = MapType<ExternalMapValue<S>>;

export type ConciseExternalMapValue<S extends PrimitiveState> = StoreUtils<S> & {
  readonly store: Store<S>;
  [REGENERATIVE_SYSTEM_KEY]: symbol;
};

// concise扩展map的类型
export type ConciseExternalMapType<S extends PrimitiveState> = MapType<ConciseExternalMapValue<S>>;

export type State<S extends PrimitiveState> = Partial<S> | S | null;

// setState —————— 更新数据的函数
export type SetState<S extends PrimitiveState> = Readonly<{
  /**
   * @param state
   * @param callback
   */
  setState(
    state: State<S> | StateFnType<S>,
    callback?: SetStateCallback<S>,
  ): void;
}>;

/**
 * setState与syncUpdate的函数更新类型
 * @description prevState的存在是有必要的，注意区分在代码的同步变更state状态的过程中
 * 从store获取最新数据值与从当前一轮更新之前的prevState中获取之前的更新状态的逻辑区别
 * @example:
 * const store = createStore({ count: 0, text: "hello world" });
 * ...
 * // change:
 * store.count = 9;
 * store.setState(prevState => {
 *   console.log(prevState.count === 0);  // true
 *   console.log(store.count === 9);  // true
 *   return {
 *     text: "ok",
 *   };
 * });
 */
export type StateFnType<S extends PrimitiveState> = (prevState: Readonly<S>) => State<S>;

/**
 * setState的回调函数的类型
 * @description 回调中nextState参数的存在是必要的，
 * 它与class类组件的this.setState的回调中通过this.state读取最新数据有所区别
 * 二者都是入栈最后执行，但是resy的nextState是每一句setState更新代码同步而来的最新数据
 * 也就是说resy它的setState的回调函数的最后的执行是记住了阶段性的最新数据，而不是最终的最新数据
 * 这一点很大程度上与类组件的this.setState区别开来
 */
export type SetStateCallback<S extends PrimitiveState> = (nextState: Readonly<S>) => void;

// setState的回调执行栈的元素类型
export type SetStateCallbackItem<S extends PrimitiveState> = {
  // 当前这一句更新代码更新的state状态数据
  nextState: S;
  callback: SetStateCallback<S>;
};

// 同步更新
export type SyncUpdate<S extends PrimitiveState> = Readonly<{
  /**
   * @description 同步更新
   * 为了react的更新机制不适应在异步中执行的场景
   * 该场景为在异步中更新受控input类输入框的value值
   * 会导致输入不了英文以外的语言文字
   * @param state
   */
  syncUpdate(
    state: State<S> | StateFnType<S>,
  ): void;
}>;

// resy的订阅监听的取消返回函数
export type Unsubscribe = Callback;

// resy的订阅监听
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

/**
 * @description 重置、恢复初始化状态，具备更新渲染效应，有一定的业务需求必要性
 */
export type Restore = Readonly<{
  restore(): void;
}>;

/**
 * 设置createStore的options参数
 * @description 之所以可以允许改变CreateStoreOptions，是因为业务场景的需要
 * 同时也是开放通道灵活开发，因为本身createStore的静态执行是一种限制
 * 如果需要在某种场景下的突然变动而无法使得静态参数设置变得可更改是一种束缚
 * 比如我有一个store初始场景是不需要unmountRestore为false，即常规下不需要永存状态信息
 * 但是突然因为业务场景的需求需要变更为我需要永存状态信息以便于在下次回到该store的运用情况的时候
 * 还能仍然保持之前的数据状态信息，这种情况是有必要的，主要是不想让CreateStoreOptions成为一种限制
 * 应该使得其作为一种辅助，但一般而言CreateStoreOptions本身的配置能够符合且满足绝大多数场景
 * 所以SetOptions的使用场景还是较少概率的。
 */
export type SetOptions = Readonly<{
  setOptions(options?: CreateStoreOptions): void;
}>;

// ConciseStore的工具方法类型
export type ConciseStoreUtils<S extends PrimitiveState> = SetState<S> & SyncUpdate<S> & Restore & Subscribe<S>;

// store的工具方法类型
export type StoreUtils<S extends PrimitiveState> = ConciseStoreUtils<S> & SetOptions;

export type Store<S extends PrimitiveState> = S & StoreUtils<S>;

// 针对class组件的混合store数据状态类型
export type MultipleState = Record<number | string | symbol, Store<any>>;

// 多个store
export type Stores<S extends MultipleState> = { [key in keyof S]: Store<S[key]> };

// 初始化数据类型
export type InitialStateType<S extends PrimitiveState> = S & ThisType<Store<S>> | (() => S & ThisType<Store<S>>);

/**
 * @description useConciseState的Store返回类型
 * 增加了store的属性调用，为了完善最新数据值的获取，
 * 弥补了useState对于最新数据值获取不足的缺陷
 */
export type ConciseStore<S extends PrimitiveState> = S & ConciseStoreUtils<S> & {
  readonly store: ConciseStore<S>;
};

// 将resy生成的store容器数据映射挂载到组件props的state属性上
export type MapStateToProps<S extends PrimitiveState, P extends PrimitiveState = {}> = P & {
  readonly state: S;
}

/**
 * resy的调度类型接口
 * @description 调度类型
 * 原本调度中还有针对setState的callback回掉进行处理的开关标识isCalling
 * 后来发现是多余不必要的，因为本身回掉Set在遍历执行的过程中即使
 * 内部再有回掉执行，也会放在Set后续尾部调用，所以这里是天然直接遍历即可
 */
export interface Scheduler<S extends PrimitiveState = {}> {
  // 更新进行中
  isUpdating: Promise<void> | null;
  // 将要更新执行的标识
  willUpdating: true | null;
  // 入栈更新数据的key/value
  pushTaskData(key: keyof S, val: ValueOf<S>): void;
  // 冲刷任务数据与任务队列
  flush(): void;
  // 获取任务数据
  getTaskData(): Map<keyof S, ValueOf<S>>;
}

/**
 * @description createStore该API第二个参数配置项
 * 目前配置项不多，且常用主要配置也是unmountRestore
 */
export type CreateStoreOptions = Readonly<{
  /**
   * @description 1、该参数主要是为了在某模块mount初始化阶段自动重置数据的，
   * 如遇到登录信息、主题等这样的全局数据而言才会设置为false，
   * 这样可以使得生成的loginStore或者themeStore系统的全局生效
   * 2、对象接口式的写法是为了兼容未来可能的未知的配置功能的增加
   * @default true
   */
  unmountRestore: boolean;
}>;

// view中equal函数的参数类型，props与state的类型合集
export type PS<P extends PrimitiveState = {}, S extends PrimitiveState = {}> = Readonly<{
  props: P;
  state: S;
}>;

// 函数类型，Function的替代类型
export type AnyFn = (...args: unknown[]) => unknown;

// view内部的stateMap的数据类型，根据是否是多store连接使用会有变化
export type ViewStateMapType<S extends PrimitiveState> = MapType<S> | ObjectMapType<S>;

// object类型的值类型推断
export type ValueOf<S extends PrimitiveState> = S[keyof S];

// map类型推断
export type MapType<S extends PrimitiveState> = Map<keyof S, ValueOf<S>>;

// object类型推断
export type ObjectType<S extends PrimitiveState> = { [key in keyof S]: S[key] };

// object值类型是map的类型推断
export type ObjectMapType<S extends PrimitiveState> = { [key in keyof S]: MapType<S> };

// stateMap恢复的状态开关标识map类型（开关标识减少多次执行带来的可能产生的额外的渲染更新）
export type StateRestoreAccomplishedMapType = MapType<{
  unmountRestoreAccomplished?: boolean | null;
  initialStateFnRestoreAccomplished?: boolean | null;
}>;

// view返回函数的参数类型
export type ViewOptionsType<P extends PrimitiveState = {}, S extends PrimitiveState = {}> = {
  stores?: Store<S> | Stores<S>;
  equal?: (next: PS<P, S>, prev: PS<P, S>) => boolean;
};
