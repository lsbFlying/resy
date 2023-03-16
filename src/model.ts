import { STORE_CORE_MAP_KEY, USE_CONCISE_STORE_KEY, USE_STORE_KEY } from "./static";

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
export type StoreMapValueType<S extends State> = {
  subscribe: (onStoreChange: Callback) => Callback;
  getSnapshot: () => S[keyof S];
  setSnapshot: (val: S[keyof S]) => void;
  useSnapshot: () => S[keyof S];
  // 存储onStoreChange的set容器，共view内部重置逻辑使用
  storeChangeSet: Set<Callback>;
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

// 监听事件的key类型
export type EventsType = number | string | symbol;

// 自定义订阅监听函数接口类型
export interface CustomEventListener<S extends State> {
  // 监听事件的合集对象
  events: Map<EventsType, Listener<S>>;
  addEventListener(type: EventsType, listener: Listener<S>): void;
  dispatchEvent(
    type: EventsType,
    effectState: Partial<S>,
    nextState: S,
    prevState: S,
  ): void;
  /**
   * @description resy销毁监听订阅的时候尽管实际上是移除了监听Set中的监听实例
   * 但是这里仍然建议移除监听的事件，即removeEventListener仍然需要
   * 是为了删除后腾出内存空间不占内存，避免"内存释放"的心智负担
   */
  removeEventListener(type: EventsType): void;
}

// 自定义监听事件的构造函数接口类型
export interface CustomEventListenerConstructor<S extends State> {
  // 声明可以作为构造函数调用
  new (): CustomEventListener<S>;
  // 声明prototype，支持后续修改prototype（这里主要是构造函数时定义了原型链上面的方法，后续不需要更改）
  prototype: CustomEventListener<S>;
}

/**
 * @description StoreCoreMap的数据值类型，作为createStore的核心Map接口类型
 * 具备处理store的监听订阅、重置数据、以及获取最新state数据等相关处理功能的核心Map
 */
export interface StoreCoreMapValue<S extends State> {
  // store内部的stateMap数据对象
  stateMap: Map<keyof S, S[keyof S]>;
  // 重置(恢复)初始化数据（供view使用）
  viewInitialReset: (stateFields: (keyof S)[]) => void;
  // 将某些数据引用挂载到store全局储存容器上
  refInStore: (refData?: Partial<S>) => void;
  // 订阅监听的事件类型
  eventType: EventsType;
  // 触发订阅监听影响的Set容器
  listenerStoreSet: Set<CustomEventListener<S>>;
  // 触发订阅监听的变动影响（即循环遍历执行listenerStoreSet中的监听函数）
  dispatchStoreEffect: (effectState: Partial<S>, nextState: S, prevState: S) => void;
}

// 每一个resy生成的store的监听订阅对象、内部stateMap数据以及重置初始化数据的方法
export type StoreCoreMapType<S extends State> = Map<
  keyof StoreCoreMapValue<S>,
  StoreCoreMapValue<S>[keyof StoreCoreMapValue<S>]
>;

export type ExternalMapValue<S extends State> = SetState<S> & Subscribe<S> & SyncUpdate<S> & {
  [STORE_CORE_MAP_KEY]: StoreCoreMapType<S>;
  [USE_STORE_KEY]: object;
  [USE_CONCISE_STORE_KEY]: object;
}

export type ExternalMapType<S extends State> = Map<
  keyof ExternalMapValue<S>,
  ExternalMapValue<S>[keyof ExternalMapValue<S>]
>;

export type ConciseExternalMapValue<S extends State> = SetState<S> & Subscribe<S> & SyncUpdate<S> & {
  readonly store: Store<S>;
}

export type ConciseExternalMapType<S extends State> = Map<
  keyof ConciseExternalMapValue<S>,
  ConciseExternalMapValue<S>[keyof ConciseExternalMapValue<S>]
>;

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
export type SetState<S extends State> = Readonly<{
  setState(
    state: Partial<S> | StateFunc<S>,
    callback?: SetStateCallback<S>,
  ): void;
}>;

// setState的函数更新处理
export type StateFunc<S extends State> = () => Partial<S>;

// setState的回调函数的类型
export type SetStateCallback<S extends State> = (nextState: S) => void;

// setState的回调执行栈的元素类型
export type SetStateCallbackItem<S extends State> = {
  // 当前一轮更新的相关数据
  cycleData: {
    // 更新的参数
    updateParams: Partial<S>,
    // 当前轮的state状态数据
    cycleState: S,
  };
  callback: SetStateCallback<S>;
};

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
export type SyncUpdate<S extends State> = Readonly<{
  syncUpdate(
    state: Partial<S> | StateFunc<S>,
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

export type Store<S extends State> = S & SetState<S> & Subscribe<S> & SyncUpdate<S>;

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
  callbackIsOn: true | null;
  // 更新进行中
  updateIsOn: Promise<void> | null;
  // 新增直接更新数据的key/value以及相应的任务函数
  add(
    task: Callback,
    key: keyof S,
    val: S[keyof S],
    taskDataMap: Map<keyof S, S[keyof S]> | null,
    taskQueueMap: Map<keyof S, Callback> | null,
  ): void;
  // 冲刷任务数据与任务队列
  flush(
    taskDataMap: Map<keyof S, S[keyof S]> | null,
    taskQueueMap: Map<keyof S, Callback> | null,
  ): void;
  // 获取任务数据与任务队列
  getTask(
    taskDataMap: Map<keyof S, S[keyof S]> | null,
    taskQueueMap: Map<keyof S, Callback> | null,
  ): {
    taskDataMap: Map<keyof S, S[keyof S]>,
    taskQueueMap: Map<keyof S, Callback>,
  };
}

// createStore该API第二个参数配置项
export type CreateStoreOptions = {
  /**
   * @description 该参数主要是为了在某模块mount初始化阶段自动重置数据的，
   * 如遇到登录信息、主题等这样的全局数据而言才会设置为false，
   * 这样可以使得生成的loginStore或者themeStore系统的全局生效
   * @default true
   */
  initialReset?: boolean;
  /**
   * be careful: 内部属性，请勿使用！！！
   * @description 该参数主要是为了使得createStore创建的store成为局部(非全局)数据状态容器
   * 一般而言如果我们使用createStore的时候是不需要设置该参数的，如果特殊需要局部数据状态容器
   * 可以使用useConciseState来获取局部数据状态，而useConciseState就是使用改参数进行实现的
   * 即该参数是相对而言库的内部使用参数
   * 如果真的想用createStore且用该参数也可以，使用方式如下：
   * function AppCom() {
   *   const {
   *      ..., store, setState, syncUpdate, subscribe,
   *   } = useMemo(() => createStore({...}, { __privatization__: true }), []);
   *
   *   return (
   *     <>{...}</>
   *   );
   * }
   */
  __privatization__?: boolean;
};

// view中isDeepEqual函数的参数类型，props与state的类型合集
export type PS<P extends State = {}, S extends State = {}> = Readonly<{
  props: P;
  state: S;
}>;

// 函数类型，Function的替代类型
export type AnyFn = (...args: unknown[]) => unknown;
