import { STORE_CORE_MAP_KEY, USE_STORE_KEY } from "./static";

export type Callback = () => void;

// 初始化数据的继承类型
export type State = Record<string, any>;

/**
 * @description resy的storeMap接口类型
 * subscribe与getSnapshot是useSyncExternalStore参数接口
 *
 * 其中subscribe的onStoreChange参数回调包含数据更新操作
 * 将这些数据更新操作的函数储存在某个Set中
 * 然后在setSnapshot中去进行forEach循环更新，结合setState可以批量更新处理
 *
 * getSnapshot单纯是获取内部静态数据值的函数
 * 刚好与useSnapshot以及subscribe组件一个两参一方的三角挂钩
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
  effectState: Partial<T>,
  prevState: T,
  nextState: T,
) => void;

// 自定义订阅监听函数接口类型
export interface CustomEventListener<T extends State> {
  // 监听事件的合集对象
  events: T;
  addEventListener(type: string | symbol, listener: Listener<T>): void;
  dispatchEvent(
    type: string | symbol,
    effectState: Partial<T>,
    prevState: T,
    nextState: T,
  ): void;
  /**
   * @description 本身EventDispatcher可以单独使用，在结合resy是销毁监听订阅的时候实际上是移除了监听Set中的监听实例
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

// 兼容适应函数入参的返回类型的使用场景
export type AdaptFuncTypeReturn<T extends State> = T | (() => T);

/**
 * @description StoreCoreMap的数据值类型，作为createStore的核心Map接口类型
 * 具备获取内部state数据对象、重置数据、订阅监听等功能
 */
export interface StoreCoreMapValue<T extends State> {
  // store内部的state数据对象
  getState: () => Map<keyof T, T[keyof T]>;
  // 设置stateMap部分字段数据值
  setHookInitialState: (hookInitialState?: AdaptFuncTypeReturn<Partial<T>>) => void;
  // 重置(恢复)初始化数据（供view使用）
  stateReset: (stateFields: (keyof T)[]) => void;
  // 订阅监听的事件类型
  eventType: string | symbol;
  // 触发订阅监听影响的Set容器
  listenerStoreSet: Set<CustomEventListener<T>>;
  // 触发订阅监听的变动影响（即循环遍历执行listenerStoreSet中的监听函数）
  dispatchStoreEffect: (effectState: Partial<T>, prevState: T, nextState: T) => void;
}

// 每一个resy生成的store的监听订阅对象、内部stateMap数据以及重置初始化数据的方法
export type StoreCoreMapType<T extends State> = Map<
  keyof StoreCoreMapValue<T>,
  StoreCoreMapValue<T>[keyof StoreCoreMapValue<T>]
>;

export type ExternalMapValue<T extends State> = SetState<T> & Subscribe<T> & SyncUpdate<T> & {
  [STORE_CORE_MAP_KEY]: StoreCoreMapType<T>;
  [USE_STORE_KEY]: object;
}

export type ExternalMapType<T extends State> = Map<
  keyof ExternalMapValue<T>,
  ExternalMapValue<T>[keyof ExternalMapValue<T>]
>;

// setState的函数更新处理
export type StateFunc = Callback;

/**
 * @description setState —————— 更新数据的函数，主要是为了批量更新
 *
 * 1、resy需要setState最主要的原因是setState本身的使用方式在编码的时候具备很好的读写能力，
 * 支持扩展运算符的对象数据更新的便捷、函数入参的循环更新的宽泛，都让setState具备更强的生命力
 *
 * 2、setState的批量更新是同步的，执行完之后通过store读取数据可立即获取到更新后的最新数据
 * 常规而言我们不需要回调函数callback就可以通过直接读取store即可获取最新数据
 * 但是有特殊情况下我们是需要通过回调函数获取最新数据的，入下所述 3👇 的情况
 *
 * 3、setState的批量更新的同步与异步的抉择设置是有考量的
 * 我们假设如果要设置为同步更新方式，那么我们似乎不需要回调函数的功能，
 * 就能直接在下一行代码通过读取store就可以获取更新后的最新数据，但是我们考虑到复杂的业务逻辑场景
 * 如果批量更新setState的入参如果是函数，并在函数中写一个setTimeout或者Promise等的延时/异步操作更新代码的情况
 * 此时即使批量更新setState的入参如果是函数，并在函数中写一个setTimeout或者Promise等的延时/异步操作更新代码
 * 那么即使setState的回调callback是再次通过setTimeout延时0ms执行也无法解决其回调的入参立即就是更新后的最新数据
 * 所以setState还是决定设置为异步更新，这样我们一不阻塞代码，可以加速代码的执行效率，二可以是的callback回调很适当的作为第二入参
 * 与此同时，改为异步后可以更完善直接更新与setState更新混用场景下的进一步完善合并批量更新
 * 并且直接更新本身是异步，这样在与setState更新混用即使因为某些复杂的场景而没有完成合并，那么也不会影响更新的顺序
 * 逻辑感知上是正常代码执行的更新顺序，是符合逻辑直觉的
 *
 * 4、大多数情况下setState与单次直接更新都是异步的，
 * 但是有些极端少数情况会在中间某一批次的更新中变成同步更新，
 * 这样做是为了保证更新的流畅性与协调度。
 *
 * @example A
 * store.setState({
 *   count: 123,
 *   text: "updateText",
 * }, (nextState) => {
 *   // nextState：最新的数据
 *   console.log(nextState);
 * });
 *
 * @description 函数入参方式主要是为了某些复杂的更新逻辑，比如在循环中更新的批量化
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

/**
 * @description 非异步更新，强制同步更新
 * A：为了react的更新机制不适应在异步中执行的场景
 * 该场景为在异步中更新受控input类输入框的value值
 * 会导致输入不了英文以外的语言文字
 *
 * B：因为是同步更新，所以没有回调函数机制
 * 它可以在同步更新函数执行完之后直接读取store的各个属性而获取最新值
 * 且不允许是函数参数，因为函数参数里可以写直接的单次更新
 * 而直接的单次更新是异步的，同步内嵌套异步会让代码变得更复杂而难以维护
 * 也不符合同步更新的本质逻辑，所以是单纯的对象数据更新即可
 *
 * C："syncUpdate" 算是resy更新调度机制与react本身针对文本输入的
 * 更新执行机制冲突的一个无奈的解决办法吧
 *
 * D：同时，同步更新也可以供给不喜欢用回调回去最新数据值的开发小伙伴使用
 * 因为它执行完之后可以通过store拿到最新的数据值进行下一步的业务逻辑处理
 */
export type SyncUpdate<T extends State> = Readonly<{
  syncUpdate(
    state: Partial<T> | T,
  ): void;
}>;

// resy的订阅监听的取消返回函数
export type Unsubscribe = Callback;

// resy的订阅监听
export type Subscribe<T extends State> = Readonly<{
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
    listener: Listener<T>,
    stateKeys?: (keyof T)[],
  ): Unsubscribe;
}>;

export type Store<S extends State> = S & SetState<S> & Subscribe<S> & SyncUpdate<S>;

// 将resy生成的store容器数据映射挂载到组件props的state属性上
export type MapStateToProps<S extends State, P extends State = {}> = P & {
  state: S;
}

/**
 * resy的调度类型接口
 * @description 调度类型
 */
export interface Scheduler<T extends State = {}> {
  // 新增直接更新数据的key/value以及相应的任务函数
  add(
    task: Callback,
    key: keyof T,
    val: T[keyof T],
    taskDataMap?: Map<keyof T, T[keyof T]>,
    taskQueueMap?: Map<keyof T, Callback>
  ): void;
  // 冲刷任务数据与任务队列
  flush(
    taskDataMap?: Map<keyof T, T[keyof T]>,
    taskQueueMap?: Map<keyof T, Callback>
  ): void;
  // 获取任务数据与任务队列
  getTask(
    taskDataMap?: Map<keyof T, T[keyof T]>,
    taskQueueMap?: Map<keyof T, Callback>
  ): {
    taskDataMap: Map<keyof T, T[keyof T]>,
    taskQueueMap: Map<keyof T, Callback>,
  };
}

// createStore该API第二个参数配置项
export type CreateStoreOptions = {
  /**
   * @description 该参数主要是为了在某模块卸载的时候自动清除初始化数据，恢复数据为初始化传入的state数据
   * 之所以会有unmountReset这样的参数设计是因为resy为了极简的使用便利性，一般是放在某个文件中进行调用返回一个store
   * 但是之后再进入该模块之后都是走的Node.js的import的缓存了，即没有再次执行resy方法了导致数据状态始终保持
   * 也就是在 "静态模板" 的实现方式下，函数是不会再次运行的
   * 但这不是一个坏事儿，因为本身store作为一个全局范围内可控可引用的状态存储器而言，具备这样的能力是有益的
   * 比如登录后的用户信息数据作为一个全局模块都可公用分享的数据而言就很好的体现了这一点
   * 但这种全局真正公用分享的数据是相对而言少数的，大部分情况下是没那么多要全局分享公用的数据的
   * 所以unmountReset默认设置为true，符合常规使用即可，除非遇到像上述登录信息数据那样的全局数据而言才会设置为false
   */
  unmountReset?: boolean;
  /**
   * @description 该参数主要是为了createStore创建的store成为局部(非全局)数据状态容器
   * 它可以用如下方式：
   * const { count, text, setState } = useConciseState({ count: 0, text: "Hello" });
   * 作用实现其实就是原生的useState：
   * const [count, setCount] = useState(0);
   * const [text, setText] = useState("Hello");
   * 如果在状态较多的情况下，useConciseState的写法较原生写法还是相对简洁明了的
   */
  privatization?: boolean;
};
