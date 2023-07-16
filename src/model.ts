import { VIEW_CONNECT_STORE_KEY, USE_CONCISE_STORE_KEY, USE_STORE_KEY } from "./static";

// 普通意义上的回调函数类型
export type Callback = () => void;

// 初始化数据的继承类型
export type State = Record<number | string | symbol, any>;

/**
 * @description resy的storeMap接口类型
 * subscribeAtomState与getAtomState是useSyncExternalStore参数接口
 *
 * 其中subscribeAtomState的onAtomStateChange参数回调包含数据更新操作
 * 将这些数据更新操作的函数储存在某个Set中
 * 然后在update中去进行forEach循环更新
 *
 * getAtomState单纯是获取内部静态数据值的函数
 * 刚好与useAtomState以及subscribe组件一个两参一方的三角挂钩
 */
export type StoreMapValueType<S extends State> = {
  // 当前元数据的状态变化事件的订阅，useSyncExternalStore的订阅
  subscribeAtomState: (onAtomStateChange: Callback) => Callback;
  // 获取当前元数据(独立单独的数据状态)
  getAtomState: () => ValueOf<S>;
  // 更新元数据的更新器
  updater: () => void;
  /**
   * 使用当前元数据，即useSyncExternalStore的useSnapshot，
   * 可以简单理解为useState的效果，具备驱动页面更新渲染的能力。
   */
  useAtomState: () => ValueOf<S>;
};

export type StoreMapValue<S extends State> = Map<
  keyof StoreMapValueType<S>,
  StoreMapValueType<S>[keyof StoreMapValueType<S>]
>;
// createStore的storeMap数据类型
export type StoreMap<S extends State> = Map<keyof S, StoreMapValue<S>>;

// 订阅事件的监听回调函数类型
export type Listener<S extends State> = (
  effectState: Partial<S>,
  nextState: S,
  prevState: S,
) => void;

/**
 * @description StoreViewMap的数据值类型，作为view这个api的核心Map接口类型
 * 具备处理store的重置数据、以及获取最新state数据等相关处理功能
 */
export interface StoreViewMapValue<S extends State> {
  /**
   * store内部的stateMap数据对象
   * 使用函数执行得到最新值，类似于useSyncExternalStore的getSnapshot
   */
  getStateMap: () => MapType<S>;
  // view初始化数据
  viewInitialReset: Callback;
  // view的props数据使用方式的数据生命周期与store关联同步
  viewConnectStore: () => Unsubscribe;
}

// 供view使用的核心连接容器Map，包括处理内部stateMap数据以及重置初始化数据的方法
export type StoreViewMapType<S extends State> = Map<
  keyof StoreViewMapValue<S>,
  StoreViewMapValue<S>[keyof StoreViewMapValue<S>]
>;

export type ExternalMapValue<S extends State> = StoreUtils<S> & {
  [VIEW_CONNECT_STORE_KEY]: StoreViewMapType<S>;
  [USE_STORE_KEY]: object;
  [USE_CONCISE_STORE_KEY]: object;
}

export type ExternalMapType<S extends State> = Map<
  keyof ExternalMapValue<S>,
  ExternalMapValue<S>[keyof ExternalMapValue<S>]
>;

export type ConciseExternalMapValue<S extends State> = StoreUtils<S> & {
  readonly store: Store<S>;
}

export type ConciseExternalMapType<S extends State> = Map<
  keyof ConciseExternalMapValue<S>,
  ConciseExternalMapValue<S>[keyof ConciseExternalMapValue<S>]
>;

/**
 * @description setState —————— 更新数据的函数
 *
 * A: resy需要setState最主要的原因是setState本身的使用方式在编码的时候具备很好的读写能力，
 * 支持扩展运算符的对象数据更新的便捷、函数入参的循环更新的宽泛，都让setState具备更强的生命力
 *
 * B: 尽管resy的每一次更新过后都可以通过store来读取最新数据，但是setState具备回调函数的功能依然是必要的
 * 因为有这样的场景：比如我更新了数据之后想要用当前这一轮更新的数据的最新结果，如果是同步代码中我们当然可以通过store获取
 * 但是如果是在异步代码中，我们依然想使用当前这一轮更新的数据的最新结果的话，就不能再通过store来获取了
 * 因为此时store可能因为在当前异步代码之外的地方有了别的更新改动，所以这时候我们需要一个回调函数，
 * 该函数的参数就是当前这一轮更新的数据最新结果，这样就可以解决同步异步导致的数据同步差异问题
 * 所以setState具备当前更新结果参数的回调函数的功能依然是必要的。
 *
 * @example A
 * store.setState({
 *   count: 123,
 *   text: "updateText",
 * });
 *
 * @description 函数入参方式主要是为了某些复杂的更新逻辑
 * @example B
 * store.setState(() => {
 *   return {
 *     count: 123,
 *     text: "updateText",
 *   };
 * });
 */
export type SetState<S extends State> = Readonly<{
  setState(
    state: Partial<S> | StateFuncType<S>,
    callback?: SetStateCallback<S>,
  ): void;
}>;

/**
 * setState的函数更新处理
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
export type StateFuncType<S extends State> = (prevState: Readonly<S>) => Partial<S>;

// setState的回调函数的类型
export type SetStateCallback<S extends State> = (nextState: S) => void;

// setState的回调执行栈的元素类型
export type SetStateCallbackItem<S extends State> = {
  // 当前这一轮的state状态数据
  cycleState: S;
  callback: SetStateCallback<S>;
};

/**
 * @description 非异步更新，强制同步更新
 * A：为了react的更新机制不适应在异步中执行的场景
 * 该场景为在异步中更新受控input类输入框的value值
 * 会导致输入不了英文以外的语言文字
 *
 * B："syncUpdate" 算是resy更新调度机制与react本身针对文本输入的
 * 更新执行机制冲突的一个无奈的解决办法
 *
 * C：同时，同步更新也可以供给不喜欢用回调回去最新数据值的开发小伙伴使用
 */
export type SyncUpdate<S extends State> = Readonly<{
  syncUpdate(
    state: Partial<S> | StateFuncType<S>,
  ): void;
}>;

// resy的订阅监听的取消返回函数
export type Unsubscribe = Callback;

// resy的订阅监听
export type Subscribe<S extends State> = Readonly<{
  /**
   * subscribe
   * @description 监听订阅，类似subscribe/addEventListener，但是这里对应的数据的变化监听订阅
   * subscribe的存在是必要的，它的作用并不类比于useEffect，
   * 而是像subscribe或者addEventListener的效果，监听订阅数据的变化
   * 具备多数据订阅监听的能力
   *
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

export type StoreUtils<S extends State> = SetState<S> & SyncUpdate<S> & Restore & Subscribe<S>;

export type Store<S extends State> = S & StoreUtils<S>;

// 多个store
export type Stores<S extends State> = { [key in keyof S]: Store<ValueOf<S>> };

/**
 * @description useConciseState的Store返回类型
 * 增加了store的属性调用，为了完善最新数据值的获取，
 * 弥补了useState对于最新数据值获取不足的缺陷
 */
export type ConciseStore<S extends State> = Store<S> & {
  readonly store: Store<S>;
};

// 将resy生成的store容器数据映射挂载到组件props的state属性上
export type MapStateToProps<S extends State, P extends State = {}> = P & {
  readonly state: S;
}

/**
 * resy的调度类型接口
 * @description 调度类型
 */
export interface Scheduler<S extends State = {}> {
  // setState的回调函数callback的任务执行中
  isCalling: true | null;
  // 更新进行中
  isUpdating: Promise<void> | null;
  // 将要更新执行的标识
  willUpdating: true | null;
  // 新增直接更新数据的key/value以及相应的任务函数
  add(
    task: Callback,
    key: keyof S,
    val: ValueOf<S>,
  ): void;
  // 冲刷任务数据与任务队列
  flush(): void;
  // 获取任务数据与任务队列
  getTasks(): {
    taskDataMap: Map<keyof S, ValueOf<S>>,
    taskQueueMap: Map<keyof S, Callback>,
  };
}

/**
 * @description createStore该API第二个参数配置项
 * 目前配置项不多，且常用主要配置也是initialReset
 */
export type CreateStoreOptions = {
  /**
   * @description 1、 该参数主要是为了在某模块mount初始化阶段自动重置数据的，
   * 如遇到登录信息、主题等这样的全局数据而言才会设置为false，
   * 这样可以使得生成的loginStore或者themeStore系统的全局生效
   *
   * 2、对象接口式的写法是为了兼容未来可能的未知的配置功能的增加
   *
   * @default true
   */
  initialReset?: boolean;
};

// view中equal函数的参数类型，props与state的类型合集
export type PS<P extends State = {}, S extends State = {}> = Readonly<{
  props: P;
  state: S;
}>;

// 函数类型，Function的替代类型
export type AnyFn = (...args: unknown[]) => unknown;

// view内部的stateMap的数据类型，根据是否是多store连接使用会有变化
export type ViewStateMapType<S extends State> = MapType<S> | ObjectMapType<S>;

// object类型的值类型推断
export type ValueOf<S extends State> = S[keyof S];

// map类型推断
export type MapType<S extends State> = Map<keyof S, ValueOf<S>>;

// object类型推断
export type ObjectType<S extends State> = { [key in keyof S]: ValueOf<S> };

// object值类型是map的类型推断
export type ObjectMapType<S extends State> = { [key in keyof S]: MapType<S> };
