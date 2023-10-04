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
 * detail course: 经过多次的临项实验
 * 最终确认放在卸载过程重置同时结合store整体的数据引用才是安全的
 */
const unmountResetHandle = <S extends PrimitiveState>(
  unmountReset: boolean,
  reducerState: S,
  stateMap: MapType<S>,
  storeStateRefSet: Set<number>,
  stateRestoreAccomplishMap: StateRestoreAccomplishMapType,
  schedulerProcessor: MapType<Scheduler>,
  initialState?: InitialStateType<S>,
) => {
  if (unmountReset && !storeStateRefSet.size && !stateRestoreAccomplishMap.get("stateRestoreAccomplish")) {
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
  unmountReset: boolean,
  reducerState: S,
  stateMap: MapType<S>,
  storeStateRefSet: Set<number>,
  stateRestoreAccomplishMap: StateRestoreAccomplishMapType,
  schedulerProcessor: MapType<Scheduler>,
  initialState?: InitialStateType<S>,
) => {
  const viewConnectStoreMap: StoreViewMapType<S> = new Map();
  viewConnectStoreMap.set("getStateMap", stateMap);
  viewConnectStoreMap.set("viewUnmountReset", () => {
    unmountResetHandle(
      unmountReset, reducerState, stateMap, storeStateRefSet,
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
  unmountReset: boolean,
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
        unmountResetHandle(
          unmountReset, reducerState, stateMap, storeStateRefSet,
          stateRestoreAccomplishMap, schedulerProcessor, initialState,
        );
      }
    };
  });

  storeMapValue.set("getOriginState", () => stateMap.get(key)!);

  storeMapValue.set("useOriginState", () => useSyncExternalStore(
    (storeMap.get(key) as StoreMapValue<S>).get("subscribeOriginState") as StoreMapValueType<S>["subscribeOriginState"],
    (storeMap.get(key) as StoreMapValue<S>).get("getOriginState") as StoreMapValueType<S>["getOriginState"],
    (storeMap.get(key) as StoreMapValue<S>).get("getOriginState") as StoreMapValueType<S>["getOriginState"],
  ));

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
