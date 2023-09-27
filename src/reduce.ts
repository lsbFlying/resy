/**
 * @description 本文件是createStore的内部代码抽离拆解的一些方法
 */
import useSyncExternalStoreExports from "use-sync-external-store/shim";
import { batchUpdate } from "./static";
import type {
  PrimitiveState, StoreViewMapType, ValueOf, MapType, Callback,
  SetStateCallbackItem, StoreMapValue, StoreMapValueType, Listener,
  Scheduler, StoreMap, StateRestoreAccomplishMapType, InitialStateType,
} from "./model";
import { followUpMap, hasOwnProperty, mapToObject, clearObject } from "./utils";

/**
 * @description 从use-sync-external-store包的导入方式到下面的引用方式
 * 是为了解决该包在ESM中的有效执行，因为use-sync-external-store这个包最终打包只导出了CJS
 * 等use-sync-external-store什么时候更新版本导出ESM模块的时候再更新吧
 */
const { useSyncExternalStore } = useSyncExternalStoreExports;

/**
 * @description storeStateRefSet自增处理
 * view连接store内部数据引用的自增指针处理
 */
const storeStateRefSetMark = (storeStateRefSet: Set<number>) => {
  const storeStateRefSetArray = [...storeStateRefSet];
  const lastTemp = storeStateRefSetArray[storeStateRefSetArray.length - 1] as (number | undefined);
  // 索引自增
  const lastItem = typeof lastTemp === "number" ? lastTemp + 1 : 0;
  // 做一个引用占位符，表示有一处引用，便于最后初始化逻辑执行的size判别
  storeStateRefSet.add(lastItem);
  return lastItem;
};

/**
 * @description 获取目前所有的keys
 * 防止store可能delete属性导致属性个数小于原始属性个数
 * 这样会导致数据没有重置处理完全，所以兼并处理
 */
export const mergeStateKeys = <S extends PrimitiveState>(
  reducerState: S,
  stateMap: MapType<S>,
) => Array.from(
    new Set(
      (
        Object.keys(reducerState) as (keyof S)[]
      ).concat(
        Array.from(stateMap.keys())
      )
    )
  );

// 获取还原出来的state
export const handleReducerState = <S extends PrimitiveState>(
  reducerState: S,
  initialState?: InitialStateType<S>,
) => {
  /**
   * @description 如果是函数返回的初始化状态数据，则需要再次执行初始化函数来获取内部初始化的逻辑数据
   * 防止因为初始化函数的内部逻辑导致重置恢复的数据不符合初始化的数据逻辑
   */
  if (typeof initialState === "function") {
    clearObject(reducerState);
    Object.entries(initialState()).forEach(([key, value]) => {
      reducerState[key as keyof S] = value;
    });
  }
};

/**
 * 初始化渲染恢复重置数据处理
 * @description 通过storeStateRefSet判断当前数据是否还有组件引用
 * 只要还有一个组件在引用当前数据，都不会重置数据，
 * 因为当前还在业务逻辑中，不属于完整的卸载
 * 完整的卸载周期对应表达的是整个store的使用周期
 *
 * most important
 * detail course 1: 原本将初始化重置放在subscribe中不稳定，
 * 可能形成数据更新的撕裂，
 * 放在useOriginState中同步执行一次解决数据撕裂的安全问题，
 *
 * detail course 2: 本质上其实是因为一个originState的数据源可能是有很多个组件使用的
 * 如果因为某一个或者部分组件的卸载而进行重置是不符合逻辑的
 * 那么即使同一个数据源的所有组件都卸载而进行重置该数据源呢
 * 事实上这样也是不符合整个store的运行逻辑的
 * 因为以整个store的角度来看，某一个数据源的全部卸载
 * 并不意味着这个数据源不会因为逻辑在后续时间内突然再次重新出现渲染加载的情况
 * 那么此时你再次加载出现就会因为之前的逻辑重置而导致数据源的状态不对应的错误
 * 比如我有一个组件需要在某一段时间内加载渲染，而其余大部分时间是不加载的
 * 那么此时它的数据源可能因为加载为0（引用为0或者全部卸载）而进行重置的话
 * 那么后续它应该加载出现的时间段内的引用数据源就会因为发生重置变更而导致数据错误
 *
 * detail course 3: 然而如果把数据的重置逻辑绑定对应到整个store上面就会变得安全
 * 可能还没反应过来，感觉按照 “detail course 2” 的思路好像还是无法解决数据错误
 * 其实仔细想想对应到整个store上是可以的，因为 “detail course 2” 的思路
 * 是你的整个store上有一个数据源被引用才会出现某一时间段的条件逻辑加载渲染
 * 如果整个store的引用都为0或者全部卸载就意味着没有任何组件再使用store的数据源
 * 此时不会存在说还有一个store的数据源可能控制着store存在组件的加载
 * 除非是外在store的数据源控制这另一个store存在的组件的加载渲染，
 * 那么即使是这种情况进行重置也是合理的，就算你用原生的useState去写一个组件被卸载
 * 然后条件重新加载它的state数据也是重置的，所以即使归论到这种情况
 * 我们对应到整个store的数据源的引用重置的逻辑也是非常合理且又安全的
 */
const initialRenderReset = <S extends PrimitiveState>(
  initialReset: boolean,
  reducerState: S,
  stateMap: MapType<S>,
  storeStateRefSet: Set<number>,
  stateRestoreAccomplishMap: StateRestoreAccomplishMapType,
  schedulerProcessor: MapType<Scheduler>,
  initialState?: InitialStateType<S>,
) => {
  if (initialReset && !storeStateRefSet.size && !stateRestoreAccomplishMap.get("stateRestoreAccomplish")) {
    stateRestoreAccomplishMap.set("stateRestoreAccomplish", true);
    handleReducerState(reducerState, initialState);
    /**
     * @description 重置数据状态（一次性全部重置）相较于直接复制 stateMap = new Map(state)的方式效率更快
     * 之所以选择全部重置是因为防止某些模块未被及时渲染导致后续数据没有被初始化恢复
     * 但是要注意此时任务队列是否有数据，如果有（一般都是同步代码中添加的更新），需要跳过
     */
    const taskDataMap = (schedulerProcessor.get("getTaskData") as Scheduler<S>["getTaskData"])();
    const ignoreKeys = Array.from(taskDataMap.keys());
    mergeStateKeys(reducerState, stateMap).forEach(key => {
      // 不是任务队列中的key则可以重置
      if (!ignoreKeys.includes(key)) {
        hasOwnProperty.call(reducerState, key)
          ? stateMap.set(key, reducerState[key])
          : stateMap.delete(key);
      }
    });
  }
};

export const genViewConnectStoreMap = <S extends PrimitiveState>(
  initialReset: boolean,
  reducerState: S,
  stateMap: MapType<S>,
  storeStateRefSet: Set<number>,
  stateRestoreAccomplishMap: StateRestoreAccomplishMapType,
  schedulerProcessor: MapType<Scheduler>,
  initialState?: InitialStateType<S>,
) => {
  const viewConnectStoreMap: StoreViewMapType<S> = new Map();
  viewConnectStoreMap.set("getStateMap", stateMap);
  viewConnectStoreMap.set("viewInitialReset", () => {
    initialRenderReset(
      initialReset, reducerState, stateMap, storeStateRefSet,
      stateRestoreAccomplishMap, schedulerProcessor, initialState,
    );
  });
  viewConnectStoreMap.set("viewConnectStore", () => {
    const storeRefIncreaseItem = storeStateRefSetMark(storeStateRefSet);
    return () => {
      storeStateRefSet.delete(storeRefIncreaseItem);
      if (storeStateRefSet.size === 0) {
        stateRestoreAccomplishMap.set("stateRestoreAccomplish", null);
      }
    };
  });
  return viewConnectStoreMap;
};

/**
 * @description 为每一个数据字段储存连接到store容器中
 * 既解决了初始化数据属性为undefined的情况，又节省了内存
 */
export const connectStore = <S extends PrimitiveState>(
  key: keyof S,
  initialReset: boolean,
  reducerState: S,
  stateMap: MapType<S>,
  storeStateRefSet: Set<number>,
  storeMap: StoreMap<S>,
  stateRestoreAccomplishMap: StateRestoreAccomplishMapType,
  schedulerProcessor: MapType<Scheduler>,
  storeChangeSet: Set<Callback>,
  initialState?: InitialStateType<S>,
) => {
  // 解决初始化属性泛型有?判断符，即一开始没有初始化的数据属性
  if (storeMap.has(key)) return storeMap;

  /**
   * @description 通过storeMapValue设置useSyncExternalStore的参数
   * 保持参数不变，减少useSyncExternalStore的内部effect执行变更
   */
  const storeMapValue: StoreMapValue<S> = new Map();

  storeMapValue.set("subscribeOriginState", (onOriginStateChange: Callback) => {
    storeChangeSet.add(onOriginStateChange);
    const storeRefIncreaseItem = storeStateRefSetMark(storeStateRefSet);
    return () => {
      storeChangeSet.delete(onOriginStateChange);
      storeStateRefSet.delete(storeRefIncreaseItem);
      if (storeStateRefSet.size === 0) {
        stateRestoreAccomplishMap.set("stateRestoreAccomplish", null);
      }
    };
  });

  storeMapValue.set("getOriginState", () => stateMap.get(key)!);

  storeMapValue.set("useOriginState", () => {
    initialRenderReset(
      initialReset, reducerState, stateMap, storeStateRefSet,
      stateRestoreAccomplishMap, schedulerProcessor, initialState,
    );
    return useSyncExternalStore(
      (storeMap.get(key) as StoreMapValue<S>).get("subscribeOriginState") as StoreMapValueType<S>["subscribeOriginState"],
      (storeMap.get(key) as StoreMapValue<S>).get("getOriginState") as StoreMapValueType<S>["getOriginState"],
      (storeMap.get(key) as StoreMapValue<S>).get("getOriginState") as StoreMapValueType<S>["getOriginState"],
    );
  });

  storeMap.set(key, storeMapValue);

  return storeMap;
};

// 批量触发订阅监听的数据变动
export const batchDispatchListener = <S extends PrimitiveState>(
  prevState: MapType<S>,
  effectState: Partial<S>,
  stateMap: MapType<S>,
  listenerSet: Set<Listener<S>>,
) => {
  if (listenerSet.size > 0) {
    listenerSet.forEach(item => {
      item({
        effectState,
        nextState: mapToObject(stateMap),
        prevState: mapToObject(prevState),
      });
    });
  }
};

// 更新任务添加入栈
export const pushTask = <S extends PrimitiveState>(
  key: keyof S,
  val: ValueOf<S>,
  stateMap: MapType<S>,
  schedulerProcessor: MapType<Scheduler>,
) => {
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
     * 同时这一步也是为了配合getOriginState，使得getOriginState可以获得最新值
     */
    stateMap.set(key, val);

    (schedulerProcessor.get("pushTaskData") as Scheduler<S>["pushTaskData"])(key, val);
  }
};

/**
 * @description 最终批量处理（更新、触发）
 * 借助then的（微任务）事件循环实现数据与任务更新的执行都统一入栈，然后冲刷更新
 * 同时可以帮助React v18以下的版本实现React管理不到的地方自动批处理更新
 * 但是异步更新的批量处理也导致无法立即获取最新数据
 * 如果想要立即同步获取最新数据可以使用setState的回调
 * 由此可见为了实现批量更新与同步获取最新数据有点拆东墙补西墙的味道
 * 但好在setState的回调弥补了同步获取最新数据的问题
 */
export const finallyBatchHandle = <S extends PrimitiveState>(
  schedulerProcessor: MapType<Scheduler>,
  prevState: MapType<S>,
  stateMap: MapType<S>,
  listenerSet: Set<Listener<S>>,
  setStateCallbackStackSet: Set<SetStateCallbackItem<S>>,
  storeChangeSet: Set<Callback>,
) => {
  // 如果当前这一条更新没有变化也就没有任务队列入栈，则不需要更新就没有必要再往下执行多余的代码了
  const taskDataMap = (schedulerProcessor.get("getTaskData") as Scheduler<S>["getTaskData"])();
  if (taskDataMap.size && !schedulerProcessor.get("isUpdating")) {
    /**
     * @description 采用微任务结合开关标志控制的方式达到批量更新的效果，
     * 完善兼容了reactV18以下的版本在微任务、宏任务中无法批量更新的缺陷
     */
    schedulerProcessor.set("isUpdating", Promise.resolve().then(() => {
      /**
       * @description 重置更新进行标识、重置当前轮的即将更新的标识
       * 这里需要将这两个标志位以及schedulerProcessor中的任务队列清空
       * 能够使得subscribe以及callback中的更新即使得到正常流程的运转
       */
      schedulerProcessor.set("isUpdating", null);
      schedulerProcessor.set("willUpdating", null);

      const taskDataMap = (schedulerProcessor.get("getTaskData") as Scheduler<S>["getTaskData"])();

      // 至此，这一轮数据更新的任务完成，立即清空冲刷任务数据与任务队列，腾出空间为下一轮数据更新做准备
      (schedulerProcessor.get("flush") as Scheduler<S>["flush"])();

      // 防止之前的数据被后续subscribe或者callback中的更新给改动了，这里及时取出保证之前的数据的阶段状态的对应
      const prevStateTemp = followUpMap(prevState);

      batchUpdate(() => {
        if (taskDataMap.size !== 0) {
          storeChangeSet.forEach(storeChange => {
            storeChange();
          });
        }
        /**
         * @description 订阅监听中的更新逻辑上应该合并在批处理中
         * 且批处理也符合逻辑自洽，减少额外多余更新的负担
         */
        batchDispatchListener(prevStateTemp, mapToObject(taskDataMap), stateMap, listenerSet);
        // 同时也顺便把回掉中可能的更新也统一批量处理了
        if (setStateCallbackStackSet.size) {
          // 先更新，再执行回调，循环调用回调
          setStateCallbackStackSet.forEach(({ callback, nextState }) => {
            callback(nextState);
          });
          setStateCallbackStackSet.clear();
        }
      });
    }));
  }
};

// 更新之前的处理
export const willUpdatingHandle = <S extends PrimitiveState>(
  schedulerProcessor: MapType<Scheduler>,
  prevState: MapType<S>,
  stateMap: MapType<S>,
) => {
  if (!schedulerProcessor.get("willUpdating")) {
    schedulerProcessor.set("willUpdating", true);
    // 在更新执行将更新之前的数据状态缓存下拉，以便于subscribe触发监听使用
    stateMap.forEach((value, key) => {
      prevState.set(key, value);
    });
  }
};
