/**
 * created by liushanbao
 * @description 一款简单易用的React数据状态管理器
 * @author liushanbao
 * @date 2022-05-05
 * @name createStore
 */
import useSyncExternalStoreExports from "use-sync-external-store/shim";
import scheduler from "./scheduler";
import {
  batchUpdate, STORE_VIEW_MAP_KEY, USE_STORE_KEY, USE_CONCISE_STORE_KEY, _RE_DEV_SY_,
} from "./static";
import { updateDataErrorHandle, mapToObject, objectToMap } from "./utils";
import type {
  Callback, ExternalMapType, ExternalMapValue, State, StateFunc, StoreViewMapType,
  StoreMap, StoreMapValue, StoreMapValueType, Unsubscribe, Scheduler, Listener,
  CreateStoreOptions, Store, AnyFn, ConciseExternalMapType, ConciseExternalMapValue,
  SetStateCallback, SetStateCallbackItem,
} from "./model";

/**
 * 从use-sync-external-store包的导入方式到下面的引用方式
 * 是为了解决该包在ESM中的有效执行，因为use-sync-external-store这个包最终打包只导出了CJS
 * 等use-sync-external-store什么时候更新版本导出ESM模块的时候再更新吧
 */
const { useSyncExternalStore } = useSyncExternalStoreExports;

/**
 * createStore
 * created by liushanbao
 * @description 创建一个可全局使用的状态存储容器
 * 初始化状态编写的时候最好加上一个自定义的准确的泛型类型，
 * 虽然resy会有类型自动推断，但是对于数据状态类型可能变化的情况下还是不够准确的
 * @author liushanbao
 * @date 2022-05-05
 * @param initialState 初始化状态数据（在有足够复杂的初始化数据逻辑场景下，函数化参数功能更能满足完善这种场景需求的写法）
 * @param options 状态容器配置项
 */
export function createStore<S extends State>(
  initialState?: S | (() => S),
  options?: CreateStoreOptions,
): Store<S> {
  /**
   * @description 做了一个假值兼容，本想兼容createStore()以及useConciseState()的，
   * 但这样刚好导致0、null、false、""、undefined、NaN都可以了
   * 但事实上我最大程度允许的假值就是JS的undefined，因为必要条件下我不想写初始化参数
   * 例如：const { count, setState } = useConciseState<{ count?: number }>();
   * 或者：const store = createStore<{ count?: number }>();
   * 我可以不写初始化参数，即使在TS中我也可以只通过一个初始化的范型类型确定代码中我要使用的数据
   * 这样写法看起来像是凭空捏造了一个有效的数据状态，it`s looks cool!
   * 但同样除了undefined其他的假值可能是开发者的代码bug，如果都兼容了不太好
   */
  // 所以在这里的Object判断中只对undefined特殊处理
  let state = initialState === undefined
    ? ({} as S)
    : typeof initialState === "function"
      ? initialState()
      : initialState;
  
  if (_RE_DEV_SY_ && Object.prototype.toString.call(state) !== "[object Object]") {
    throw new Error("The initialization parameter result of createStore needs to be an object!");
  }
  
  const { initialReset = true } = typeof options === "boolean"
    ? options
      ? {}
      : { initialReset: false }
    : (options || {});
  
  // 当前store的调度处理器
  const schedulerProcessor = scheduler();
  
  // 对应整个store的数据引用标记的set集合
  const storeRefSet = new Set<number>();
  
  /**
   * @description storeRefSet自增处理
   * view连接store内部数据引用的自增指针处理
   */
  function storeRefSetSelfIncreasing() {
    const lastTemp = [...storeRefSet].at(-1);
    // 索引自增
    const lastItem = typeof lastTemp === "number" ? lastTemp + 1 : 0;
    // 做一个引用占位符，表示有一处引用，便于最后初始化逻辑执行的size判别
    storeRefSet.add(lastItem);
    return lastItem;
  }
  
  /**
   * @description 不改变传参state，同时resy使用Map与Set提升性能
   * 如stateMap、storeMap、storeViewMap、storeChangeSet等
   */
  let stateMap: Map<keyof S, S[keyof S]> = objectToMap(state);
  // 由于stateMap的设置前置了，优化了同步数据的获取，但是对于之前的数据状态也会需要前处理
  let prevState: Map<keyof S, S[keyof S]> | null = null;
  
  // stateMap是否在view中整体重置过的的标记
  let stateMapViewResetFlag: boolean | undefined;
  // 复位stateMapViewResetFlag标记
  function stateMapViewResetHandle() {
    if (initialReset && stateMapViewResetFlag && !storeRefSet.size) {
      stateMapViewResetFlag = false;
    }
  }
  
  // 重置初始化stateMap状态
  function resetStateMap(key: keyof S) {
    Object.prototype.hasOwnProperty.call(state, key)
      ? stateMap.set(key, state[key])
      : stateMap.delete(key);
  }
  
  /**
   * setState的回调函数执行栈数组
   * 用Array没有用Set或者Map是因为内部需要用索引index
   */
  const setStateCallbackStackArray: SetStateCallbackItem<S>[] = [];
  
  // setState的回调函数添加入栈
  function setStateCallbackStackPush(cycleState: S, callback: SetStateCallback<S>) {
    setStateCallbackStackArray.push({
      cycleState,
      callback,
    });
  }
  
  // 订阅监听Set容器
  const listenerSet = new Set<Listener<S>>();
  
  // 处理view连接store、以及获取最新state数据的相关处理Map
  const storeViewMap: StoreViewMapType<S> = new Map();
  storeViewMap.set("getStateMap", () => stateMap);
  storeViewMap.set("viewInitialReset", () => {
    if (initialReset && !stateMapViewResetFlag && !storeRefSet.size) {
      stateMapViewResetFlag = true;
      /**
       * view初始化的时候执行直接一次性覆盖即可，
       * 而如果是在useSyncExternalStore的初始化中执行则按key逐个执行初始化重置
       * 主要是view初始化一开始拿不到全部的数据引用，
       * 而useSyncExternalStore使用的时候可以拿到具体的数据引用
       */
      stateMap = objectToMap(state);
    }
  });
  storeViewMap.set("viewConnectStore", () => {
    const storeRefIncreaseItem = storeRefSetSelfIncreasing();
    return () => {
      storeRefSet.delete(storeRefIncreaseItem);
      stateMapViewResetHandle();
    }
  });
  
  // 数据存储容器storeMap
  const storeMap: StoreMap<S> = new Map();
  
  // 生成storeMap键值对
  function genStoreMapKeyValue(key: keyof S) {
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
      const storeRefIncreaseItem = storeRefSetSelfIncreasing();
      return () => {
        storeChangeSet.delete(onAtomStateChange);
        storeRefSet.delete(storeRefIncreaseItem);
        stateMapViewResetHandle();
      };
    });
    
    storeMapValue.set("getAtomState", () => stateMap.get(key));
    
    storeMapValue.set("updater", () => {
      // 这一步才是真正的更新数据，通过useSyncExternalStore的内部变动后强制更新来刷新数据驱动页面更新
      storeChangeSet.forEach(storeChange => storeChange?.());
    });
    
    storeMapValue.set("useAtomState", () => {
      /**
       * @description 通过storeRefSet判断当前数据是否还有组件引用
       * 只要还有一个组件在引用当前数据，都不会重置数据，
       * 因为当前还在业务逻辑中，不属于完整的卸载
       * 完整的卸载周期对应表达的是整个store的
       *
       * 原本将初始化重置放在subscribe中不稳定，
       * 可能形成数据更新的撕裂，放在useAtomState中同步执行一次解决数据撕裂的安全问题
       *
       * 且也不能放在subscribe的return回调中卸载执行，以防止外部接口调用数据导致的数据不统一
       */
      if (initialReset && !stateMapViewResetFlag && !storeRefSet.size) {
        resetStateMap(key);
      }
      return useSyncExternalStore(
        (storeMap.get(key) as StoreMapValue<S>).get("subscribeAtomState") as StoreMapValueType<S>["subscribeAtomState"],
        (storeMap.get(key) as StoreMapValue<S>).get("getAtomState") as StoreMapValueType<S>["getAtomState"],
        (storeMap.get(key) as StoreMapValue<S>).get("getAtomState") as StoreMapValueType<S>["getAtomState"],
      );
    });
    
    storeMap.set(key, storeMapValue);
  }
  
  // 为每一个数据字段储存连接到store容器中
  function initialValueConnectStore(key: keyof S) {
    // 解决初始化属性泛型有?判断符，即一开始没有初始化的数据属性
    if (storeMap.has(key)) return storeMap;
    genStoreMapKeyValue(key);
    return storeMap;
  }
  
  // 批量触发订阅监听的数据变动
  function batchDispatchListener(prevState: Map<keyof S, S[keyof S]>, changedData: Partial<S>) {
    if (listenerSet.size > 0) {
      const nextStateTemp = mapToObject(stateMap);
      const prevStateTemp = mapToObject(prevState);
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
  function taskPush(key: keyof S, val: S[keyof S]) {
    let changed;
    /**
     * @description 考虑极端复杂的情况下业务逻辑有需要更新某个数据为函数，或者本身函数也有变更
     * 同时使用Object.is避免一些特殊情况，虽然实际业务上设置值为NaN/+0/-0的情况并不多见
     */
    if (!Object.is(val, stateMap.get(key))) {
      changed = true;
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
            initialValueConnectStore(key).get(key) as StoreMapValue<S>
          ).get("updater") as StoreMapValueType<S>["updater"]
        )(),
        key,
        val,
      );
    }
    return changed;
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
  function finallyBatchHandle() {
    // 如果当前这一条更新没有变化也就没有任务队列入栈，则不需要更新就没有必要再往下执行多余的代码了
    const { taskQueueMap } = (schedulerProcessor.get("getTasks") as Scheduler<S>["getTasks"])();
    if (taskQueueMap.size && !schedulerProcessor.get("isUpdating")) {
      /**
       * @description 采用微任务结合开关标志控制的方式达到批量更新的效果，
       * 完善兼容了reactV18以下的版本在微任务、宏任务中无法批量更新的缺陷
       */
      schedulerProcessor.set("isUpdating", Promise.resolve().then(() => {
        // 重置更新进行标识
        schedulerProcessor.set("isUpdating", null);
        // 重置当前轮的即将更新的标识
        schedulerProcessor.set("willUpdating", null);
        
        // 防止之前的数据被别的更新改动，这里及时取出保证之前的数据的阶段状态的对应
        const prevStateTemp = new Map(prevState as Map<keyof S, S[keyof S]>);
        
        const { taskDataMap, taskQueueMap } = (schedulerProcessor.get("getTasks") as Scheduler<S>["getTasks"])();
        // 至此，这一轮数据更新的任务完成，立即清空冲刷任务数据与任务队列，腾出空间为下一轮数据更新做准备
        (schedulerProcessor.get("flush") as Scheduler<S>["flush"])();
        
        if (taskDataMap.size !== 0) {
          batchUpdate(() => {
            taskQueueMap.forEach(task => task());
            batchDispatchListener(prevStateTemp, mapToObject(taskDataMap));
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
   * 同步更新
   * @description todo 更多意义上是为了解决input无法输入非英文语言bug的无奈，后续待优化setState与单次更新
   */
  function syncUpdate(updateParams: Partial<S> | StateFunc<S>) {
    updateDataErrorHandle(updateParams, "syncUpdate");
    let updateParamsTemp = updateParams as Partial<S>;
    if (typeof updateParams === "function") {
      updateParamsTemp = (updateParams as StateFunc<S>)();
    }
    const prevStateTemp = new Map(stateMap);
    batchUpdate(() => {
      let effectState: Partial<S> | null = null;
      Object.keys(updateParamsTemp).forEach(key => {
        const val = (updateParamsTemp as Partial<S> | S)[key];
        if (!Object.is(val, stateMap.get(key))) {
          stateMap.set(key, val);
          !effectState && (effectState = {});
          effectState[key as keyof S] = val;
          (
            (
              initialValueConnectStore(key).get(key) as StoreMapValue<S>
            ).get("updater") as StoreMapValueType<S>["updater"]
          )();
        }
      });
      // 不管batchUpdate是在何种模式下，同步还是异步，这里也顺便统一更新订阅中的更新了
      effectState && batchDispatchListener(prevStateTemp, effectState);
    });
  }
  
  // 更新函数入栈
  function updater(updateParams: Partial<S> | StateFunc<S>) {
    let changed;
    if (typeof updateParams !== "function") {
      // 对象方式更新直接走单次直接更新的添加入栈，后续统一批次合并更新
      Object.keys(updateParams).forEach(key => {
        const changedTemp = taskPush(key, (updateParams as Partial<S> | S)[key]);
        if (changedTemp) changed = true;
      });
      return {
        updateParams,
        changed,
      };
    } else {
      /**
       * @description
       * 1、如果stateParams是函数的情况并且在函数中使用了直接更新的方式更新数据
       * 那么这里需要先调用stateParams函数，产生一个直接更新的新一轮的批次更新
       * 然后再直接检查产生的直接更新中这一轮的批次中的最新任务数据与任务队列，然后进行冲刷与更新
       *
       * 2、如果stateParams函数中不是使用直接更新的方式，
       * 而是又使用了setState，那么会走到else分支仍然批量更新
       * 因为如果是函数入参里面更新肯定通过scheduler调度统一共用到单次直接更新的逻辑，
       * 不管它当前更新层是否使用，它最终总归会使用到单次直接更新的批量合并这一步
       *
       * 3、并且这种函数入参的更新具有更高效完善的合并优势，
       * "即函数入参内部的更新触发的订阅函数内的更新会统一成一个批次更新"
       * 它是凭借这种方式的 "执行时效" 并结合unstable_batchedUpdates内部的批处理实现
       * "执行时效" 在于触发的订阅函数内的更新会随着第一次setState函数更新的then而冲刷更新掉
       * 而这个冲刷更新与前一个函数入参内的更新的时间间隔仅有4ms以内左右
       * 而之所以这样前后冲刷的间隔只有4ms以内左右，
       * 是因为它相对于常规而言少经历了订阅函数内部更新的一个promise函数的执行
       * 而promise函数在底层实现中还是较为复杂的，需要的代码时耗也有几毫秒
       * 刚好常规而言的订阅联动更新就在这几毫秒的差距中就实现了批次处理的分水岭
       * 而4ms左右这样的一个时间间隔
       * 在react中就会被unstable_batchedUpdates或者react内部的调度机制处理成统一批次的更新
       * be careful：当然这里的特性是在react-V18中才有的，因为react-V18的unstable_batchedUpdates做了优化
       * 如果是react-V18以下的版本，则还是分两个批次渲染更新。
       */
      const updateParamsTemp = (updateParams as StateFunc<S>)();
      Object.keys(updateParamsTemp).forEach(key => {
        const changedTemp = taskPush(key, (updateParamsTemp as S)[key]);
        if (changedTemp) changed = true;
      });
      return {
        updateParams: updateParamsTemp,
        changed,
      };
    }
  }
  
  // 异步更新之前的处理
  function handleWillUpdating(params?: { changed?: boolean, keyVal?: { key: keyof S, val: S[keyof S] } }) {
    const { changed, keyVal } = params ?? {};
    if (
      (
        changed || (
          keyVal && !Object.is(keyVal.val, stateMap.get(keyVal.key))
        )
      )
      && !schedulerProcessor.get("willUpdating")
    ) {
      schedulerProcessor.set("willUpdating", true);
      // 在更新执行将更新之前的数据状态缓存下拉，以便于subscribe触发监听使用
      prevState = new Map(stateMap);
    }
  }
  
  // 可对象数据更新的函数
  function setState(updateParams: Partial<S> | StateFunc<S>, callback?: SetStateCallback<S>) {
    updateDataErrorHandle(updateParams, "setState");
    const { updateParams: updateParamsTemp, changed } = updater(updateParams);
    handleWillUpdating({ changed });
    // 异步回调添加入栈
    if (callback) {
      const nextState = Object.assign({}, mapToObject(stateMap), updateParamsTemp);
      /**
       * 如果是回调在执行时发现回调中有更setState并且有回调，
       * 此时回调进入下一个微任务循环中添加入栈，不影响这一轮的回调执行栈的执行
       */
      schedulerProcessor.get("isCalling")
        ? Promise.resolve().then(() => {
          setStateCallbackStackPush(nextState, callback);
        })
        : setStateCallbackStackPush(nextState, callback);
    }
    finallyBatchHandle();
  }
  
  // 订阅函数
  function subscribe(listener: Listener<S>, stateKeys?: (keyof S)[]): Unsubscribe {
    const listenerWrap: Listener<S> = (effectState, nextState, prevState) => {
      const listenerKeysIsEmpty = stateKeys === undefined || !(stateKeys && stateKeys.length !== 0);
      /**
       * 事实上最终订阅触发时，每一个订阅的这个外层listener都被触发了，
       * 只是这里在最终执行内层listener的时候做了数据变化的判断才实现了subscribe中的listener的是否执行
       */
      if (
        listenerKeysIsEmpty
        || (
          !listenerKeysIsEmpty
          && Object.keys(effectState).some(key => stateKeys.includes(key))
        )
      ) listener(effectState, nextState, prevState);
    };
    
    listenerSet.add(listenerWrap);
    
    // 显示返回解除订阅函数供用户自行选择是否解除订阅，因为也有可能用户想要一个订阅一直生效
    return () => {
      listenerSet.delete(listenerWrap);
    };
  }
  
  // 重置恢复初始化状态数据
  function restore() {
    const prevStateTemp = new Map(stateMap);
    /**
     * 如果是函数返回的初始化状态数据，则需要再次执行初始化函数来获取内部初始化的逻辑数据
     * 防止因为初始化函数的内部逻辑导致重置恢复的数据不符合初始化的数据逻辑
     */
    if (typeof initialState === "function") state = initialState();
    
    batchUpdate(() => {
      let effectState: Partial<S> | null = null;
      prevStateTemp.forEach((_, key) => {
        const val = state[key];
        if (!Object.is(val, stateMap.get(key))) {
          resetStateMap(key);
          
          !effectState && (effectState = {});
          effectState[key as keyof S] = val;
          
          (
            (
              initialValueConnectStore(key).get(key) as StoreMapValue<S>
            ).get("updater") as StoreMapValueType<S>["updater"]
          )();
        }
      });
      
      effectState && batchDispatchListener(prevStateTemp, effectState);
    });
  }
  
  // 单个属性数据更新
  function singlePropUpdate(_: S, key: keyof S, val: S[keyof S]) {
    handleWillUpdating({ keyVal: { key, val } });
    taskPush(key, val);
    finallyBatchHandle();
    return true;
  }
  
  /**
   * 防止有对象继承了createStore生成的代理对象，
   * 同时initialState属性中又有 "属性描述对象" 的get (getter) 或者set (setter) 存取器 的写法
   * 会导致proxy中的receiver对象指向的this上下文对象变化
   * 使得 get / set 所得到的数据产生非期望的数据值
   * set不会影响数据，因为set之后会从proxy的get走，所以只要控制好get即可保证数据的正确性
   * @description be careful：为了避免原型链继承导致的需要Reflect.get
   * 从继承者对象自身获取setState等同名重写函数影响createStore本身的逻辑
   * 所以这里this只代理数据层，不包含函数层（setState、syncUpdate、subscribe）
   */
  function proxyReceiverThisHandle(proxyReceiver: any, proxyStore: any, target: S, key: keyof S) {
    return proxyStore === proxyReceiver
      ? stateMap.get(key)
      : Reflect.get(target, key, proxyReceiver);
  }
  
  // setState、subscribe与syncUpdate以及store代理内部数据Map的合集
  const externalMap: ExternalMapType<S> = new Map();
  
  // 给useStore的驱动更新代理
  const storeProxy = new Proxy(storeMap, {
    get(_, key: keyof S) {
      if (typeof stateMap.get(key) === "function") {
        return (stateMap.get(key) as AnyFn).bind(undefined);
      }
      return externalMap.get(key as keyof ExternalMapValue<S>)
        || (
          (
            (
              initialValueConnectStore(key) as StoreMap<S>
            ).get(key) as StoreMapValue<S>
          ).get("useAtomState") as StoreMapValueType<S>["useAtomState"]
        )();
    },
  } as ProxyHandler<StoreMap<S>>);
  
  externalMap.set("setState", setState);
  externalMap.set("syncUpdate", syncUpdate);
  externalMap.set("subscribe", subscribe);
  externalMap.set("restore", restore);
  
  const conciseExternalMap = new Map(externalMap) as ConciseExternalMapType<S>;
  
  /**
   * @description 给useConciseState的store代理的额外的store代理，
   * 同时store不仅仅是单纯的数据读取操作，set/sync/sub三个函数的使用一样可以，
   * 并且也让store具有单个数据属性更新的能力
   * 与createStore生成的store具有一样的功能
   * be careful: 这样主要是为了解决react的useState中产生的数据不具有可追溯性的问题
   * 比如在某些函数中因为因为或者作用域的不同导致函数内部再次获取useState的数据会不准确
   * 而使用这个额外的store来读取数据可以具有追溯性得到最新的数据状态
   */
  const conciseExtraStoreProxy = new Proxy(state, {
    get(target, key: keyof S, receiver: any) {
      if (typeof stateMap.get(key) === "function") {
        return (stateMap.get(key) as AnyFn).bind(undefined);
      }
      return conciseExternalMap.get(key as keyof ConciseExternalMapValue<S>)
        || proxyReceiverThisHandle(receiver, conciseExtraStoreProxy, target, key);
    },
    set: singlePropUpdate,
  } as ProxyHandler<S>) as Store<S>;
  
  conciseExternalMap.set("store", conciseExtraStoreProxy);
  
  // 给useConciseState的驱动更新代理，与useStore分离开来，避免useStore中解构读取store产生冗余
  const conciseStoreProxy = new Proxy(storeMap, {
    get(_, key: keyof S) {
      if (typeof stateMap.get(key) === "function") {
        return (stateMap.get(key) as AnyFn).bind(undefined);
      }
      return conciseExternalMap.get(key as keyof ConciseExternalMapValue<S>) || (
        (
          (
            initialValueConnectStore(key) as StoreMap<S>
          ).get(key) as StoreMapValue<S>
        ).get("useAtomState") as StoreMapValueType<S>["useAtomState"]
      )();
    },
  } as ProxyHandler<StoreMap<S>>);
  
  externalMap.set(STORE_VIEW_MAP_KEY, storeViewMap);
  externalMap.set(USE_STORE_KEY, storeProxy);
  externalMap.set(USE_CONCISE_STORE_KEY, conciseStoreProxy);
  
  const store = new Proxy(state, {
    get(target, key: keyof S, receiver: any) {
      if (typeof stateMap.get(key) === "function") {
        // 出于js中this指向的复杂性以及js本身不是纯面向对象语言的考量，将this指向禁用，一律改为this指向undefined
        return (stateMap.get(key) as AnyFn).bind(undefined);
      }
      return externalMap.get(key as keyof ExternalMapValue<S>)
        || proxyReceiverThisHandle(receiver, store, target, key);
    },
    set: singlePropUpdate,
    setPrototypeOf() {
      console.error(
        new Error(
          "store is not recommended to be set as a prototype chain object for a certain object!" +
          " resy will default the prototype object of the store to null."
        )
      );
      Object.setPrototypeOf(store, null);
      return true;
    },
    getPrototypeOf() {
      console.error(
        new Error(
          "resy will default the prototype object of the store to null."
        )
      );
      return null;
    },
    // delete 也会起到更新作用
    deleteProperty(_: S, key: keyof S) {
      handleWillUpdating({ keyVal: { key, val: undefined as S[keyof S] } });
      taskPush(key, undefined as S[keyof S]);
      finallyBatchHandle();
      return true;
    },
    construct() {
      console.error(
        new Error(
          "Store is not recommended as a constructor to create new objects," +
          " even if it is forcibly constructed and created, it is still its own."
        )
      );
      return store;
    }
  } as ProxyHandler<S>) as Store<S>;
  
  return store;
}
