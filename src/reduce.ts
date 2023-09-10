/**
 * @description 本文件是createStore的内部代码抽离拆解的一些方法
 */
import useSyncExternalStoreExports from "use-sync-external-store/shim";
import { batchUpdate } from "./static";
import type {
  PrimitiveState, StoreViewMapType, ValueOf, MapType, Callback, SetStateCallbackItem,
  StoreMapValue, StoreMapValueType, Listener, Scheduler, StoreMap, StateRestoreAccomplishMapType,
} from "./model";
import { followUpMap, mapToObject } from "./utils";

/**
 * 从use-sync-external-store包的导入方式到下面的引用方式
 * 是为了解决该包在ESM中的有效执行，因为use-sync-external-store这个包最终打包只导出了CJS
 * 等use-sync-external-store什么时候更新版本导出ESM模块的时候再更新吧
 */
const { useSyncExternalStore } = useSyncExternalStoreExports;

/**
 * @description storeStateRefSet自增处理
 * view连接store内部数据引用的自增指针处理
 */
const storeStateRefSetMark = (storeStateRefSet: Set<number>) => {
  const lastTemp = [...storeStateRefSet].at(-1);
  // 索引自增
  const lastItem = typeof lastTemp === "number" ? lastTemp + 1 : 0;
  // 做一个引用占位符，表示有一处引用，便于最后初始化逻辑执行的size判别
  storeStateRefSet.add(lastItem);
  return lastItem;
};

/**
 * @description stateMap的恢复（复位）初始化
 * 同时相较于直接复制 stateMap = new Map(state)的方式效率更快
 */
const stateMapRestore = <S extends PrimitiveState>(state: S, stateMap: MapType<S>) => {
  stateMap.clear();
  Object.entries(state).forEach(([key, value]) => {
    stateMap.set(key, value);
  });
};

/**
 * 初始化渲染恢复重置数据处理
 * @description 通过storeStateRefSet判断当前数据是否还有组件引用
 * 只要还有一个组件在引用当前数据，都不会重置数据，
 * 因为当前还在业务逻辑中，不属于完整的卸载
 * 完整的卸载周期对应表达的是整个store的使用周期
 * course one：
 * 原本将初始化重置放在subscribe中不稳定，
 * 可能形成数据更新的撕裂，放在useOriginState中同步执行一次解决数据撕裂的安全问题
 * course two：
 * 且也不能放在subscribe的return回调中卸载执行，以防止外部接口调用数据导致的数据不统一
 * 即使你放在subscribe的return回调中的setTimeout执行也无法保证外部调用的宏任务的顺序机制的执行可能
 * 所以只有结合数据引用挂在标识以及渲染重置才是最安全合理的解决方式
 */
const initialRenderRestore = <S extends PrimitiveState>(
  initialReset: boolean,
  state: S,
  stateMap: MapType<S>,
  storeStateRefSet: Set<number>,
  stateRestoreAccomplishMap: StateRestoreAccomplishMapType,
) => {
  if (initialReset && !storeStateRefSet.size && !stateRestoreAccomplishMap.get("stateRestoreAccomplish")) {
    stateRestoreAccomplishMap.set("stateRestoreAccomplish", true);
    /**
     * 重置数据状态（一次性全部重置）
     * 之所以选择全部重置是因为防止某些模块未被及时渲染导致后续数据没有被初始化恢复
     */
    stateMapRestore(state, stateMap);
  }
};

export const genViewConnectStoreMap = <S extends PrimitiveState>(
  initialReset: boolean,
  state: S,
  stateMap: MapType<S>,
  storeStateRefSet: Set<number>,
  stateRestoreAccomplishMap: StateRestoreAccomplishMapType,
) => {
  const viewConnectStoreMap: StoreViewMapType<S> = new Map();
  viewConnectStoreMap.set("getStateMap", () => stateMap);
  viewConnectStoreMap.set("viewInitialReset", () => {
    initialRenderRestore(initialReset, state, stateMap, storeStateRefSet, stateRestoreAccomplishMap);
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
  state: S,
  stateMap: MapType<S>,
  storeStateRefSet: Set<number>,
  storeMap: StoreMap<S>,
  stateRestoreAccomplishMap: StateRestoreAccomplishMapType,
) => {
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

  storeMapValue.set("getOriginState", () => stateMap.get(key));

  storeMapValue.set("updater", () => {
    // 这一步才是真正的更新数据，通过useSyncExternalStore的内部变动后强制更新来刷新数据驱动页面更新
    storeChangeSet.forEach(storeChange => {
      storeChange();
    });
  });

  storeMapValue.set("useOriginState", () => {
    initialRenderRestore(initialReset, state, stateMap, storeStateRefSet, stateRestoreAccomplishMap);
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
  initialReset: boolean,
  state: S,
  stateMap: MapType<S>,
  storeStateRefSet: Set<number>,
  storeMap: StoreMap<S>,
  schedulerProcessor: MapType<Scheduler>,
  stateRestoreAccomplishMap: StateRestoreAccomplishMapType,
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

    (schedulerProcessor.get("add") as Scheduler<S>["add"])(
      () => (
        (
          connectStore(
            key, initialReset, state, stateMap, storeStateRefSet, storeMap, stateRestoreAccomplishMap,
          ).get(key) as StoreMapValue<S>
        ).get("updater") as StoreMapValueType<S>["updater"]
      )(),
      key,
      val,
    );
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
) => {
  // 如果当前这一条更新没有变化也就没有任务队列入栈，则不需要更新就没有必要再往下执行多余的代码了
  const { taskQueueMap } = (schedulerProcessor.get("getTasks") as Scheduler<S>["getTasks"])();
  if (taskQueueMap.size && !schedulerProcessor.get("isUpdating")) {
    /**
     * @description 采用微任务结合开关标志控制的方式达到批量更新的效果，
     * 完善兼容了reactV18以下的版本在微任务、宏任务中无法批量更新的缺陷
     * detail course:
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
      const prevStateTemp = followUpMap(prevState);

      const { taskDataMap, taskQueueMap } = (schedulerProcessor.get("getTasks") as Scheduler<S>["getTasks"])();
      // 至此，这一轮数据更新的任务完成，立即清空冲刷任务数据与任务队列，腾出空间为下一轮数据更新做准备
      (schedulerProcessor.get("flush") as Scheduler<S>["flush"])();

      if (taskDataMap.size !== 0) {
        batchUpdate(() => {
          taskQueueMap.forEach(task => {
            task();
          });
          // 不管batchUpdate是在何种模式下，同步还是异步，这里也顺便统一更新订阅中的更新了
          batchDispatchListener(prevStateTemp, mapToObject(taskDataMap), stateMap, listenerSet);
        });
      }

      if (setStateCallbackStackSet.size) {
        schedulerProcessor.set("isCalling", true);
        // 先更新，再执行回调，循环调用回调
        setStateCallbackStackSet.forEach(({ callback, nextState }) => {
          callback(nextState);
        });
        schedulerProcessor.set("isCalling", null);
        setStateCallbackStackSet.clear();
      }
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
