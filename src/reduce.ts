import useSyncExternalStoreExports from "use-sync-external-store/shim";
import { batchUpdate, VIEW_CONNECT_STORE_KEY } from "./static";
import type {
  State, Store, StoreViewMapType, StoreViewMapValue, Stores, ValueOf, MapType,
  Callback, SetStateCallback, SetStateCallbackItem, StoreMapValue, StoreMapValueType,
  Listener, Scheduler, StoreMap,
} from "./model";
import { mapToObject, objectToMap, fnPropUpdateErrorHandle } from "./utils";

/**
 * 从use-sync-external-store包的导入方式到下面的引用方式
 * 是为了解决该包在ESM中的有效执行，因为use-sync-external-store这个包最终打包只导出了CJS
 * 等use-sync-external-store什么时候更新版本导出ESM模块的时候再更新吧
 */
const { useSyncExternalStore } = useSyncExternalStoreExports;

/**
 * 给Comp组件的props上挂载的state属性数据做一层引用代理
 * @description 核心作用是找出SCU或者useMemo所需要的更新依赖的数据属性
 */
export function stateRefByProxyHandle<S extends State>(
  stateMap: MapType<S>,
  innerUseStateSet: Set<keyof S>,
) {
  const store = new Proxy(stateMap, {
    get: (target: MapType<S>, key: keyof S, receiver: any) => {
      innerUseStateSet.add(key);
      /**
       * stateMap(即最新的状态数据Map-latestState)给出了resy生成的store内部数据的引用，
       * 这里始终能获取到最新数据
       * 同时兼容考虑Reflect的bug兼容写法
       */
      return receiver === store
        ? target.get(key)
        : Reflect.get(target, key, receiver);
    },
  } as ProxyHandler<MapType<S>>) as object as S;
  return store;
}

// view的多store的最新数据的处理
export function viewStoresToLatestState<S extends State>(stores: Stores<S>) {
  const latestStateTemp = {} as { [key in keyof Stores<S>]: ValueOf<S> };
  for (const storesKey in stores) {
    if (Object.prototype.hasOwnProperty.call(stores, storesKey)) {
      latestStateTemp[storesKey] = mapToObject(getLatestStateMap(stores[storesKey]));
    }
  }
  return latestStateTemp as S;
}

// view的多个store的state更新处理
export function viewStoresStateUpdateHandle<S extends State>(
  state: { [key in keyof Stores<S>]: S },
  innerUseStateSet: Set<keyof S>,
  nextState: S,
  storesKey?: keyof Stores<S>,
) {
  const stateTemp: { [key in keyof Stores<S>]: S } = Object.assign({}, state);
  Object.keys(state).forEach(storesKeyItem => {
    if (storesKey === storesKeyItem) {
      stateTemp[storesKey] = stateRefByProxyHandle(new Map(Object.entries(nextState)), innerUseStateSet)
    }
  });
  return stateTemp;
}

// 获取最新数据Map对象
export function getLatestStateMap<S extends State = {}>(store?: Store<S>) {
  if (!store) return new Map() as MapType<S>;
  return (
    (
      store[VIEW_CONNECT_STORE_KEY as keyof S] as StoreViewMapType<S>
    ).get("getStateMap") as StoreViewMapValue<S>["getStateMap"]
  )();
}

/**
 * @description storeStateRefSet自增处理
 * view连接store内部数据引用的自增指针处理
 */
export function storeStateRefSetMark(storeStateRefSet: Set<number>) {
  const lastTemp = [...storeStateRefSet].at(-1);
  // 索引自增
  const lastItem = typeof lastTemp === "number" ? lastTemp + 1 : 0;
  // 做一个引用占位符，表示有一处引用，便于最后初始化逻辑执行的size判别
  storeStateRefSet.add(lastItem);
  return lastItem;
}

// 重置初始化stateMap状态
export function resetStateMap<S extends State>(key: keyof S, state: S, stateMap: MapType<S>) {
  Object.prototype.hasOwnProperty.call(state, key)
    ? stateMap.set(key, state[key])
    : stateMap.delete(key);
}

// setState的回调函数添加入栈
export function setStateCallbackStackPush<S extends State>(
  cycleState: S,
  callback: SetStateCallback<S>,
  setStateCallbackStackArray: SetStateCallbackItem<S>[],
) {
  setStateCallbackStackArray.push({
    cycleState,
    callback,
  });
}

export function genViewConnectStoreMap<S extends State>(
  initialReset: boolean,
  state: S,
  stateMap: MapType<S>,
  storeStateRefSet: Set<number>,
) {
  const viewConnectStoreMap: StoreViewMapType<S> = new Map();
  viewConnectStoreMap.set("getStateMap", () => stateMap);
  viewConnectStoreMap.set("viewInitialReset", () => {
    if (initialReset && !storeStateRefSet.size) {
      /**
       * storeStateRefSet.size的判断完善了直接一次性覆盖的安全性
       * view初始化的时候执行直接一次性覆盖即可，
       * 而如果是在useSyncExternalStore的初始化中执行则按key逐个执行初始化重置
       * 主要是view初始化一开始拿不到全部的数据引用，
       * 而useSyncExternalStore使用的时候可以拿到具体的数据引用
       */
      stateMap = objectToMap(state);
    }
  });
  viewConnectStoreMap.set("viewConnectStore", () => {
    const storeRefIncreaseItem = storeStateRefSetMark(storeStateRefSet);
    return () => {
      storeStateRefSet.delete(storeRefIncreaseItem);
    }
  });
  return viewConnectStoreMap;
}

// 为每一个数据字段储存连接到store容器中
export function connectStore<S extends State>(
  key: keyof S,
  initialReset: boolean,
  state: S,
  stateMap: MapType<S>,
  storeStateRefSet: Set<number>,
  storeMap: StoreMap<S>,
) {
  // 解决初始化属性泛型有?判断符，即一开始没有初始化的数据属性
  if (storeMap.has(key)) return storeMap;
  
  /**
   * @description 为每一个数据的change更新回调做一个闭包Set储存
   * 之所以用Set不用Map是因为每一个使用数据字段
   * 都需要一个subscribe的强更新绑定回调
   * 而每一个绑定回调函数是针对组件对于数据使用的更新开关
   */
  const storeChangeSet = new Set<Callback>();
  
  const storeMapValue: StoreMapValue<S> = new Map();
  storeMapValue.set("subscribeAtomState", (onAtomStateChange: Callback) => {
    storeChangeSet.add(onAtomStateChange);
    const storeRefIncreaseItem = storeStateRefSetMark(storeStateRefSet);
    return () => {
      storeChangeSet.delete(onAtomStateChange);
      storeStateRefSet.delete(storeRefIncreaseItem);
    };
  });
  
  storeMapValue.set("getAtomState", () => stateMap.get(key));
  
  storeMapValue.set("updater", () => {
    // 这一步才是真正的更新数据，通过useSyncExternalStore的内部变动后强制更新来刷新数据驱动页面更新
    storeChangeSet.forEach(storeChange => storeChange());
  });
  
  storeMapValue.set("useAtomState", () => {
    /**
     * @description 通过storeStateRefSet判断当前数据是否还有组件引用
     * 只要还有一个组件在引用当前数据，都不会重置数据，
     * 因为当前还在业务逻辑中，不属于完整的卸载
     * 完整的卸载周期对应表达的是整个store的
     *
     * 原本将初始化重置放在subscribe中不稳定，
     * 可能形成数据更新的撕裂，放在useAtomState中同步执行一次解决数据撕裂的安全问题
     *
     * 且也不能放在subscribe的return回调中卸载执行，以防止外部接口调用数据导致的数据不统一
     */
    if (initialReset && !storeStateRefSet.size) {
      resetStateMap(key, state, stateMap);
    }
    return useSyncExternalStore(
      (storeMap.get(key) as StoreMapValue<S>).get("subscribeAtomState") as StoreMapValueType<S>["subscribeAtomState"],
      (storeMap.get(key) as StoreMapValue<S>).get("getAtomState") as StoreMapValueType<S>["getAtomState"],
      (storeMap.get(key) as StoreMapValue<S>).get("getAtomState") as StoreMapValueType<S>["getAtomState"],
    );
  });
  
  storeMap.set(key, storeMapValue);
  
  return storeMap;
}

// 批量触发订阅监听的数据变动
export function batchDispatchListener<S extends State>(
  prevStateParams: MapType<S>,
  changedData: Partial<S>,
  stateMap: MapType<S>,
  listenerSet: Set<Listener<S>>,
) {
  if (listenerSet.size > 0) {
    const nextStateTemp = mapToObject(stateMap);
    const prevStateTemp = mapToObject(prevStateParams);
    listenerSet.forEach(item => item(
      changedData,
      nextStateTemp,
      prevStateTemp,
    ));
  }
}

/**
 * @description 更新任务添加入栈
 * be careful：因为考虑到不知道什么情况的业务逻辑需要函数作为数据属性来进行更新
 * 所以这里没有阻止函数作为数据属性的更新
 */
export function taskPush<S extends State>(
  key: keyof S,
  val: ValueOf<S>,
  initialReset: boolean,
  state: S,
  stateMap: MapType<S>,
  storeStateRefSet: Set<number>,
  storeMap: StoreMap<S>,
  schedulerProcessor: MapType<Scheduler>,
) {
  /**
   * 不仅要以val最新的值为准来判断，还需要之前的老数据进行结合判断，
   * 因为防止更新的值为空值导致函数为空，始终以最新的数据值为准进行函数属性检查
   */
  fnPropUpdateErrorHandle(key, stateMap.get(key) || val);
  /**
   * @description 考虑极端复杂的情况下业务逻辑有需要更新某个数据为函数，或者本身函数也有变更
   * 同时使用Object.is避免一些特殊情况，虽然实际业务上设置值为NaN/+0/-0的情况并不多见
   */
  if (!Object.is(val, stateMap.get(key))) {
    /**
     * 需要在入栈前就将每一步结果累计出来
     * 比如遇到连续的数据操作就需要如此
     * @example
     * store.count++;
     * store.count++;
     * store.count++;
     * 加了三次，如果count初始化值是0，那么理论上结果需要是3
     *
     * 同时这一步也是为了配合getAtomState，使得getAtomState可以获得最新值
     */
    stateMap.set(key, val);
    
    (schedulerProcessor.get("add") as Scheduler<S>["add"])(
      () => (
        (
          connectStore(
            key, initialReset, state, stateMap, storeStateRefSet, storeMap
          ).get(key) as StoreMapValue<S>
        ).get("updater") as StoreMapValueType<S>["updater"]
      )(),
      key,
      val,
    );
  }
}

/**
 * @description 最终批量处理（更新、触发）
 * 借助then的（微任务）事件循环实现数据与任务更新的执行都统一入栈，然后冲刷更新
 * 同时可以帮助React v18以下的版本实现React管理不到的地方自动批处理更新
 * 但是异步更新的批量处理也导致无法立即获取最新数据
 * 如果想要立即同步获取最新数据可以使用setState的回调
 * 由此可见为了实现批量更新与同步获取最新数据有点拆东墙补西墙的味道
 * 但好在setState的回调弥补了同步获取最新数据的问题
 */
export function finallyBatchHandle<S extends State>(
  schedulerProcessor: MapType<Scheduler>,
  prevState: MapType<S> | null,
  stateMap: MapType<S>,
  listenerSet: Set<Listener<S>>,
  setStateCallbackStackArray: SetStateCallbackItem<S>[],
) {
  // 如果当前这一条更新没有变化也就没有任务队列入栈，则不需要更新就没有必要再往下执行多余的代码了
  const { taskQueueMap } = (schedulerProcessor.get("getTasks") as Scheduler<S>["getTasks"])();
  if (taskQueueMap.size && !schedulerProcessor.get("isUpdating")) {
    /**
     * @description 采用微任务结合开关标志控制的方式达到批量更新的效果，
     * 完善兼容了reactV18以下的版本在微任务、宏任务中无法批量更新的缺陷
     *
     * isUpdating、willUpdating的标志位重置必须放在batchUpdate之前重置，因为batchUpdate会有异步情况，
     * 而batchUpdate里面的batchDispatchListener会存在同步更新数据的情况，
     * 本身isUpdating的微任务执行方式已经是异步，而其内部的异步执行不会被等待阻塞，
     * 所以及时重置标识位可以不阻塞别的更新流程，同时这种情况下显得prevStateTemp的必要性是存在有意义的。
     */
    schedulerProcessor.set("isUpdating", Promise.resolve().then(() => {
      // 重置更新进行标识
      schedulerProcessor.set("isUpdating", null);
      // 重置当前轮的即将更新的标识
      schedulerProcessor.set("willUpdating", null);
      
      // 防止之前的数据被别的更新改动，这里及时取出保证之前的数据的阶段状态的对应
      const prevStateTemp = new Map(prevState as MapType<S>);
      
      const { taskDataMap, taskQueueMap } = (schedulerProcessor.get("getTasks") as Scheduler<S>["getTasks"])();
      // 至此，这一轮数据更新的任务完成，立即清空冲刷任务数据与任务队列，腾出空间为下一轮数据更新做准备
      (schedulerProcessor.get("flush") as Scheduler<S>["flush"])();
      
      if (taskDataMap.size !== 0) {
        batchUpdate(() => {
          taskQueueMap.forEach(task => task());
          // 不管batchUpdate是在何种模式下，同步还是异步，这里也顺便统一更新订阅中的更新了
          batchDispatchListener(prevStateTemp, mapToObject(taskDataMap), stateMap, listenerSet);
        });
      }
      
      if (setStateCallbackStackArray.length) {
        schedulerProcessor.set("isCalling", true);
        // 先更新，再执行回调，循环调用回调
        setStateCallbackStackArray.forEach((
          {callback, cycleState}, index, array,
        ) => {
          callback(cycleState);
          if (index === array.length - 1) schedulerProcessor.set("isCalling", null);
        });
        // 清空回调执行栈，否则回调中如果有更新则形成死循环
        setStateCallbackStackArray.splice(0);
      }
    }));
  }
}

/**
 * 防止有对象继承了createStore生成的代理对象，
 * 同时initialState属性中又有 "属性描述对象" 的get (getter) 或者set (setter) 存取器 的写法
 * 会导致proxy中的receiver对象指向的this上下文对象变化
 * 使得 get / set 所得到的数据产生非期望的数据值
 * set不会影响数据，因为set之后会从proxy的get走，所以只要控制好get即可保证数据的正确性
 */
export function proxyReceiverThisHandle<S extends State>(
  proxyReceiver: any,
  proxyStore: any,
  target: S,
  key: keyof S,
  stateMap: MapType<S>,
) {
  return proxyStore === proxyReceiver
    ? stateMap.get(key)
    : Reflect.get(target, key, proxyReceiver);
}
