/**
 * @description 本文件是createStore的内部代码抽离拆解的一些方法
 */
import useSyncExternalStoreExports from "use-sync-external-store/shim";
import { batchUpdate } from "./static";
import type {
  PrimitiveState, StoreViewMapType, ValueOf, MapType, Callback,
  SetStateCallbackItem, StoreMapValue, StoreMapValueType, Listener,
  Scheduler, StoreMap, StateRestoreAccomplishedMapType, InitialStateType,
} from "./model";
import { hasOwnProperty, mapToObject, clearObject } from "./utils";

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
  // 原始方式比at(-1)快
  const lastTemp = storeStateRefSetArray[storeStateRefSetArray.length - 1] as (number | undefined);
  // 索引自增
  const lastItem = typeof lastTemp === "number" ? lastTemp + 1 : 0;
  // 做一个引用占位符，表示有一处引用，便于最后初始化逻辑执行的size判别
  storeStateRefSet.add(lastItem);
  return lastItem;
};

/**
 * @description 获取目前所有的keys
 * 🌟这里需要合并处理key的问题，因为可能存在delete key的情况
 * 这会导致字段属性数据不统一协调，存在缺失导致数据变化没有完全捕捉到
 * 而restore回复到原始数据状态需要捕捉到所有的状态key然后才可以捕捉到所有的value变化
 * 包括initialRestore或者unmountRestore都是如此
 * 所以这里需要使用merge合并key进行数据属性以及状态的合并捕捉处理
 * 这里也不用担心后续增加的key如果被删除的情况，因为每一次的delete操作也属于更新操作
 * 并且会有相应的delete key的完善更进，所以这里的处理足以完成回复到初始状态的功能
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
   *
   * 卸载的情况下也选择函数刷新执行恢复，是因为我们很难把控到initialState参数作为函数的情况下
   * 它的内部逻辑有怎样的需求设定会执行我们难以预料的一些逻辑操作，所以为了安全起见选择卸载的情况下也执行一下函数刷新恢复
   */
  if (typeof initialState === "function") {
    clearObject(reducerState);
    Object.entries(initialState()).forEach(([key, value]) => {
      reducerState[key as keyof S] = value;
    });
  }
};

const restoreHandle = <S extends PrimitiveState>(
  reducerState: S,
  stateMap: MapType<S>,
  initialState?: InitialStateType<S>,
) => {
  // 进一步获取最新的还原状态数据
  handleReducerState(reducerState, initialState);
  /**
   * @description 重置数据状态（一次性全部重置）相较于直接复制 stateMap = new Map(state)的方式效率更快
   * 之所以选择全部重置是因为防止某些模块未被及时渲染导致后续数据没有被初始化恢复
   */
  mergeStateKeys(reducerState, stateMap).forEach(key => {
    hasOwnProperty.call(reducerState, key)
      ? stateMap.set(key, reducerState[key])
      : stateMap.delete(key);
  });
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
 *
 * 与此同时需要注意的是，如果initialState是函数，
 * 那么后续重新渲染的时候需要重新执行initialState函数恢复初始化状态数据reducerState
 *
 * 所以restoreHandle运用在两个阶段，一是卸载阶段，一是初始化阶段
 */
const unmountRestoreHandle = <S extends PrimitiveState>(
  unmountRestore: boolean,
  reducerState: S,
  stateMap: MapType<S>,
  storeStateRefSet: Set<number>,
  stateRestoreAccomplishedMap: StateRestoreAccomplishedMapType,
  initialState?: InitialStateType<S>,
) => {
  if (
    unmountRestore
    && !storeStateRefSet.size
    && !stateRestoreAccomplishedMap.get("unmountRestoreAccomplished")
  ) {
    stateRestoreAccomplishedMap.set("unmountRestoreAccomplished", true);
    restoreHandle(reducerState, stateMap, initialState);
  }
};

// initialState是函数的情况下的刷新恢复处理（与unmountRestoreHandle分开处理避免开关状态的混乱产生执行逻辑错误）
const initialStateFnRestoreHandle = <S extends PrimitiveState>(
  reducerState: S,
  stateMap: MapType<S>,
  storeStateRefSet: Set<number>,
  stateRestoreAccomplishedMap: StateRestoreAccomplishedMapType,
  initialState?: InitialStateType<S>,
) => {
  if (
    typeof initialState === "function"
    && !storeStateRefSet.size
    && !stateRestoreAccomplishedMap.get("initialStateFnRestoreAccomplished")
  ) {
    stateRestoreAccomplishedMap.set("initialStateFnRestoreAccomplished", true);
    restoreHandle(reducerState, stateMap, initialState);
  }
};

// 生成view连接store的map对象
export const genViewConnectStoreMap = <S extends PrimitiveState>(
  unmountRestore: boolean,
  reducerState: S,
  stateMap: MapType<S>,
  storeStateRefSet: Set<number>,
  stateRestoreAccomplishedMap: StateRestoreAccomplishedMapType,
  schedulerProcessor: MapType<Scheduler>,
  initialState?: InitialStateType<S>,
) => {
  const viewConnectStoreMap: StoreViewMapType<S> = new Map();
  viewConnectStoreMap.set("getStateMap", stateMap);
  viewConnectStoreMap.set("viewUnmountRestore", () => {
    unmountRestoreHandle(
      unmountRestore, reducerState, stateMap, storeStateRefSet,
      stateRestoreAccomplishedMap, initialState,
    );
  });
  viewConnectStoreMap.set("viewInitialStateFnRestore", () => {
    initialStateFnRestoreHandle(
      reducerState, stateMap, storeStateRefSet,
      stateRestoreAccomplishedMap, initialState,
    );
  });
  viewConnectStoreMap.set("viewConnectStore", () => {
    const storeRefIncreaseItem = storeStateRefSetMark(storeStateRefSet);
    return () => {
      storeStateRefSet.delete(storeRefIncreaseItem);
      if (!schedulerProcessor.get("deferDestructorFlag")) {
        schedulerProcessor.set("deferDestructorFlag", Promise.resolve().then(() => {
          schedulerProcessor.set("deferDestructorFlag", null);
          if (!storeStateRefSet.size) {
            stateRestoreAccomplishedMap.set("unmountRestoreAccomplished", null);
            stateRestoreAccomplishedMap.set("initialStateFnRestoreAccomplished", null);
          }
        }));
      }
    };
  });
  return viewConnectStoreMap;
};

/**
 * @description 为每一个数据字段储存连接到store容器中
 * 既解决了初始化数据属性为undefined的情况，又节省了内存
 * 🌟：对于参数的传入虽然可以用...args扩展Rest parameters（剩余参数）语法，
 * 将所有参数捆绑为一个数组，然后将数组类型定义为元组类型；
 * 但是这种方式不及直接传入参数使用高效，中间多了数据解构的过程会降低代码执行效率
 * 直接参数的传入虽然写法更繁琐，但是效率高，作为底层建设库建议使用这种方式
 */
export const connectStore = <S extends PrimitiveState>(
  key: keyof S,
  unmountRestore: boolean,
  reducerState: S,
  stateMap: MapType<S>,
  storeStateRefSet: Set<number>,
  storeMap: StoreMap<S>,
  stateRestoreAccomplishedMap: StateRestoreAccomplishedMapType,
  schedulerProcessor: MapType<Scheduler>,
  initialState?: InitialStateType<S>,
) => {
  // 解决初始化属性泛型有?判断符，即一开始没有初始化的数据属性
  if (storeMap.has(key)) return storeMap;

  /**
   * @description 通过storeMapValue设置useSyncExternalStore的参数
   * 保持参数不变，减少useSyncExternalStore的内部effect执行变更
   */
  const storeMapValue: StoreMapValue<S> = new Map();
  // 单个属性的渲染使用标记Set储存
  const singlePropStoreChangeSet = new Set<Callback>();

  storeMapValue.set("subscribeOriginState", (onOriginStateChange: Callback) => {
    /**
     * @description 单个属性的渲染使用标记 + 1，最终通过singlePropStoreChangeSet.size识别标记是否清楚是否存在
     * 当singlePropStoreChangeSet.size === 0没有标记时即当前属性key没有渲染使用，
     * 即可移除storeMapValue对象，delete卸载删除释放内存，减轻内存占用，提高内存使用效率
     * 同时源数据属性更新队列没有放在全局当中，即更即取即消的处理方式对于运行内存以及运算优势更加迅速
     */
    singlePropStoreChangeSet.add(onOriginStateChange);

    const storeRefIncreaseItem = storeStateRefSetMark(storeStateRefSet);

    return () => {
      singlePropStoreChangeSet.delete(onOriginStateChange);
      storeStateRefSet.delete(storeRefIncreaseItem);

      /**
       * @description 为防止react的StrictMode严格模式带来的两次渲染导致effect的return的注册函数
       * 会在中间执行一次导致storeMap提前释放内存
       * 中间释放内存会移除之前的storeMapValue然后后续更新或者渲染会重新生成新的storeMapValue
       * 而这导致updater函数中访问的singlePropStoreChangeSet是上一次
       * 生成旧的storeMapValue时候的singlePropStoreChangeSet地址
       * 🌟而旧的singlePropStoreChangeSet早就被删除清空，导致不会有更新能力 ————（有点复杂有点绕，注意理解）
       * 同时storeStateRefSet的条件判断执行如果在StrictMode下两次渲染也是不合理的
       * 同样困原因扰的还有view的viewConnectStore的Destructor的过渡执行
       * 以及view中effectedHandle的Destructor的过渡执行
       * 所以其余两处同样需要defer延迟处理
       *
       * 这里通过一个微任务执行，让在执行卸载释放内存以及unmountRestore等一系列操作时有一个经历double-effect的缓冲执行时机
       * 此时微任务中再执行singlePropStoreChangeSet以及storeStateRefSet在React.StrictMode情况下是有值的了，
       */
      if (!schedulerProcessor.get("deferDestructorFlag")) {
        schedulerProcessor.set("deferDestructorFlag", Promise.resolve().then(() => {
          schedulerProcessor.set("deferDestructorFlag", null);
          if (!storeStateRefSet.size) {
            // 打开开关执行刷新恢复数据
            stateRestoreAccomplishedMap.set("unmountRestoreAccomplished", null);
            stateRestoreAccomplishedMap.set("initialStateFnRestoreAccomplished", null);
            unmountRestoreHandle(
              unmountRestore, reducerState, stateMap, storeStateRefSet,
              stateRestoreAccomplishedMap, initialState,
            );
          }
          // 释放内存
          if (!singlePropStoreChangeSet.size) storeMap.delete(key);
        }));
      }
    };
  });

  storeMapValue.set("getOriginState", () => stateMap.get(key)!);

  storeMapValue.set("useOriginState", () => useSyncExternalStore(
    (storeMap.get(key) as StoreMapValue<S>).get("subscribeOriginState") as StoreMapValueType<S>["subscribeOriginState"],
    (storeMap.get(key) as StoreMapValue<S>).get("getOriginState") as StoreMapValueType<S>["getOriginState"],
    (storeMap.get(key) as StoreMapValue<S>).get("getOriginState") as StoreMapValueType<S>["getOriginState"],
  ));

  storeMapValue.set("updater", () => {
    singlePropStoreChangeSet.forEach(storeChange => {
      storeChange();
    });
  });

  storeMap.set(key, storeMapValue);

  return storeMap;
};

/**
 * @description useState的变相调用
 * 不使用useXXX的命名方式是为了避免hook调用规则的类型检查报错，
 * 这里无论是函数类型的数据还是其他类型的数据的hook数据规则的调用都是符合要求的
 * 所以本质上不用担心hook调用规则的问题，可以看作就是hook的调用
 */
export const connectHookUse = <S extends PrimitiveState>(
  key: keyof S,
  unmountRestore: boolean,
  reducerState: S,
  stateMap: MapType<S>,
  storeStateRefSet: Set<number>,
  storeMap: StoreMap<S>,
  stateRestoreAccomplishedMap: StateRestoreAccomplishedMapType,
  schedulerProcessor: MapType<Scheduler>,
  initialState?: InitialStateType<S>,
) => {
  // 如果initialState是函数则强制执行刷新恢复的逻辑，initialState是函数的情况下权重高于unmountRestore
  initialStateFnRestoreHandle(
    reducerState, stateMap, storeStateRefSet,
    stateRestoreAccomplishedMap, initialState,
  );
  return (
    connectStore(
      key, unmountRestore, reducerState, stateMap, storeStateRefSet,
      storeMap, stateRestoreAccomplishedMap, schedulerProcessor, initialState,
    ).get(key)!.get("useOriginState") as StoreMapValueType<S>["useOriginState"]
  )();
};

// 批量触发订阅监听的数据变动
export const batchDispatchListener = <S extends PrimitiveState>(
  prevState: MapType<S>,
  effectState: Partial<S>,
  stateMap: MapType<S>,
  listenerSet: Set<Listener<S>>,
) => {
  listenerSet.forEach(item => {
    // 这里mapToObject的复制体让外部的订阅使用保持尽量的纯洁与安全性
    item({
      effectState,
      nextState: mapToObject(stateMap),
      prevState: mapToObject(prevState),
    });
  });
};

// 更新任务添加入栈
export const pushTask = <S extends PrimitiveState>(
  key: keyof S,
  value: ValueOf<S>,
  stateMap: MapType<S>,
  schedulerProcessor: MapType<Scheduler>,
  unmountRestore: boolean,
  reducerState: S,
  storeStateRefSet: Set<number>,
  storeMap: StoreMap<S>,
  stateRestoreAccomplishedMap: StateRestoreAccomplishedMapType,
  initialState?: InitialStateType<S>,
  isDelete?: true,
) => {
  /**
   * @description 考虑极端复杂的情况下业务逻辑有需要更新某个数据为函数，或者本身函数也有变更
   * 同时使用Object.is避免一些特殊情况，虽然实际业务上设置值为NaN/+0/-0的情况并不多见
   */
  if (!Object.is(value, stateMap.get(key))) {
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
    !isDelete ? stateMap.set(key, value) : stateMap.delete(key);

    (schedulerProcessor.get("pushTask") as Scheduler<S>["pushTask"])(
      key,
      value,
      connectStore(
        key, unmountRestore, reducerState, stateMap, storeStateRefSet,
        storeMap, stateRestoreAccomplishedMap, schedulerProcessor, initialState,
      ).get(key)!.get("updater") as StoreMapValueType<S>["updater"],
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
  const { taskDataMap } = (schedulerProcessor.get("getTasks") as Scheduler<S>["getTasks"])();
  if (taskDataMap.size > 0 && !schedulerProcessor.get("isUpdating")) {
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

      const { taskDataMap, taskQueueSet } = (schedulerProcessor.get("getTasks") as Scheduler<S>["getTasks"])();

      batchUpdate(() => {
        if (taskDataMap.size > 0) {
          taskQueueSet.forEach(task => {
            task();
          });
        }
        /**
         * @description 订阅监听中的更新逻辑上应该合并在批处理中
         * 且批处理也符合逻辑自洽，减少额外多余更新的负担
         *
         * 这里的巧妙之处在于它不仅仅是监听订阅函数的执行触发，
         * 更重要的是view中监听订阅的数据变动函数在这里得到了执行更新
         * 所以在subscribeOriginState里面进行相关数据的delete的操作是不会影响view中数据的更新的
         *
         * 因为view中的数据是自身的useState产生的，
         * 它的更新动力只是借助了这里的监听订阅的数据触发驱动而已
         */
        if (listenerSet.size > 0) {
          batchDispatchListener(prevState, mapToObject(taskDataMap), stateMap, listenerSet);
        }

        // 同时也顺便把回掉中可能的更新也统一批量处理了
        if (setStateCallbackStackSet.size > 0) {
          // 先更新，再执行回调，循环调用回调
          setStateCallbackStackSet.forEach(({ callback, nextState }) => {
            callback(nextState);
          });
          setStateCallbackStackSet.clear();
        }

        // 至此，这一轮数据更新的任务完成，立即清空冲刷任务数据与任务队列，腾出空间为下一轮数据更新做准备
        (schedulerProcessor.get("flush") as Scheduler<S>["flush"])();
      });
    }));
  }
};

// prevState同步更进到stateMap
export const prevStateFollowUpStateMap = <S extends PrimitiveState>(
  prevState: MapType<S>,
  stateMap: MapType<S>,
) => {
  // 因为key的变化可能被删除，或者一开始不存在而后添加，所以这里先清空再设置
  prevState.clear();
  stateMap.forEach((value, key) => {
    prevState.set(key, value);
  });
};

// 更新之前的处理
export const willUpdatingHandle = <S extends PrimitiveState>(
  schedulerProcessor: MapType<Scheduler>,
  prevState: MapType<S>,
  stateMap: MapType<S>,
) => {
  if (!schedulerProcessor.get("willUpdating")) {
    schedulerProcessor.set("willUpdating", true);
    // 在更新执行将更新之前的数据状态缓存一下，以便于subscribe触发监听使用
    prevStateFollowUpStateMap(prevState, stateMap);
  }
};
