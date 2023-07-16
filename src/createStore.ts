/**
 * created by liushanbao
 * @description 一款简单易用的React数据状态管理器
 * @author liushanbao
 * @date 2022-05-05
 * @name createStore
 */
import scheduler from "./scheduler";
import {
  batchUpdate, VIEW_CONNECT_STORE_KEY, USE_STORE_KEY, USE_CONCISE_STORE_KEY, _RE_DEV_SY_, RESY_ID,
} from "./static";
import {
  stateErrorHandle, mapToObject, objectToMap, fnPropUpdateErrorHandle,
} from "./utils";
import {
  resetStateMap, setStateCallbackStackPush, genViewConnectStoreMap, connectStore,
  batchDispatchListener, taskPush, finallyBatchHandle, proxyReceiverThisHandle,
} from "./reduce";
import type {
  ExternalMapType, ExternalMapValue, State, StateFuncType, StoreMap, StoreMapValue, StoreMapValueType,
  Unsubscribe, Listener, CreateStoreOptions, Store, AnyFn, ConciseExternalMapType, ConciseExternalMapValue,
  SetStateCallback, SetStateCallbackItem, MapType, ValueOf,
} from "./model";

/**
 * createStore
 * created by liushanbao
 * @description 创建一个可全局使用的状态存储容器
 * 初始化状态编写的时候最好加上一个自定义的准确的泛型类型，
 * 虽然resy会有类型自动推断，但是对于数据状态类型可能变化的情况下还是不够准确的
 * @author liushanbao
 * @date 2022-05-05
 * @param initialState 初始化状态数据
 * 在有足够复杂的初始化数据逻辑场景下，"函数化参数" 功能更能满足完善这种场景需求的写法的便利性
 * 最重要的是结合restore方法具有必须的重置恢复数据初始化的能力保证初始化逻辑执行的正确性
 * @param options 状态容器配置项
 */
export function createStore<S extends State>(
  initialState?: S & ThisType<Store<S>> | (() => S & ThisType<Store<S>>),
  options?: CreateStoreOptions,
): Store<S> {
  // 解析还原出来的数据状态
  let reducerState = initialState === undefined
    ? ({} as S)
    : typeof initialState === "function"
      ? initialState()
      : initialState;
  
  stateErrorHandle(reducerState, "createStore");
  
  const { initialReset = true } = options || {};
  
  // 当前store的调度处理器
  const schedulerProcessor = scheduler();
  
  // 对应整个store的数据引用标记的set集合
  const storeStateRefSet = new Set<number>();
  
  /**
   * @description 由于proxy读取数据本身相较于原型链读取数据要慢，
   * 所以在不改变传参state的情况下，同时resy使用Map与Set提升性能，来弥补proxy的性能缺陷
   */
  let stateMap: MapType<S> = objectToMap(reducerState);
  // 由于stateMap的设置前置了，优化了同步数据的获取，但是对于之前的数据状态也会需要前置处理
  let prevState: MapType<S> | null = null;
  
  /**
   * setState的回调函数执行栈数组
   * 用Array没有用Set或者Map是因为内部需要用索引index
   */
  const setStateCallbackStackArray: SetStateCallbackItem<S>[] = [];
  
  // 订阅监听Set容器
  const listenerSet = new Set<Listener<S>>();
  
  // 处理view连接store、以及获取最新state数据的相关处理Map
  const viewConnectStoreMap = genViewConnectStoreMap(initialReset, reducerState, stateMap, storeStateRefSet);
  
  // 数据存储容器storeMap
  const storeMap: StoreMap<S> = new Map();
  
  // 更新之前的处理
  function willUpdatingHandle() {
    if (!schedulerProcessor.get("willUpdating")) {
      schedulerProcessor.set("willUpdating", true);
      // 在更新执行将更新之前的数据状态缓存下拉，以便于subscribe触发监听使用
      prevState = new Map(stateMap);
    }
  }
  
  /**
   * 同步更新
   * @description todo 更多意义上是为了解决input无法输入非英文语言bug的无奈，后续待优化setState与单次更新
   */
  function syncUpdate(state: Partial<S> | StateFuncType<S>) {
    let stateParams = state as Partial<S>;
    if (typeof state === "function") {
      stateParams = (state as StateFuncType<S>)(mapToObject(prevState || stateMap));
    }
    
    stateErrorHandle(stateParams, "syncUpdate");
    
    const prevStateTemp = new Map(stateMap);
    batchUpdate(() => {
      let effectState: Partial<S> | null = null;
      Object.keys(stateParams).forEach(key => {
        const val = (stateParams as Partial<S> | S)[key];
        
        fnPropUpdateErrorHandle(key, val || stateMap.get(key));
        
        if (!Object.is(val, stateMap.get(key))) {
          stateMap.set(key, val);
          !effectState && (effectState = {});
          effectState[key as keyof S] = val;
          (
            (
              connectStore(
                key, initialReset, reducerState, stateMap, storeStateRefSet, storeMap,
              ).get(key) as StoreMapValue<S>
            ).get("updater") as StoreMapValueType<S>["updater"]
          )();
        }
      });
      effectState && batchDispatchListener(prevStateTemp, effectState, stateMap, listenerSet);
    });
  }
  
  // 可对象数据更新的函数
  function setState(state: Partial<S> | StateFuncType<S>, callback?: SetStateCallback<S>) {
    // 调度处理器内部的willUpdating需要在更新之前开启，这里不管是否有变化需要更新，
    // 先打开缓存一下prevState方便后续订阅事件的触发执行
    willUpdatingHandle();
    
    let stateParams = state as Partial<S>;
    
    if (typeof state !== "function") {
      // 对象方式更新直接走单次直接更新的添加入栈，后续统一批次合并更新
      Object.keys(state).forEach(key => {
        taskPush(
          key, (state as Partial<S> | S)[key], initialReset, reducerState,
          stateMap, storeStateRefSet, storeMap, schedulerProcessor,
        );
      });
    } else {
      const stateParamsTemp = (state as StateFuncType<S>)(mapToObject(prevState as MapType<S>));
      Object.keys(stateParamsTemp).forEach(key => {
        taskPush(
          key, (stateParamsTemp as S)[key], initialReset, reducerState,
          stateMap, storeStateRefSet, storeMap, schedulerProcessor,
        );
      });
      stateParams = stateParamsTemp;
    }
  
    stateErrorHandle(stateParams, "setState");
    
    // 异步回调添加入栈
    if (callback) {
      const nextState = Object.assign({}, mapToObject(stateMap), stateParams);
      /**
       * 如果是回调在执行时发现回调中有更setState并且有回调，
       * 此时回调进入下一个微任务循环中添加入栈，不影响这一轮的回调执行栈的执行
       */
      schedulerProcessor.get("isCalling")
        ? Promise.resolve().then(() => {
          setStateCallbackStackPush(nextState, callback, setStateCallbackStackArray);
        })
        : setStateCallbackStackPush(nextState, callback, setStateCallbackStackArray);
    }
    finallyBatchHandle(schedulerProcessor, prevState, stateMap, listenerSet, setStateCallbackStackArray);
  }
  
  // 重置恢复初始化状态数据
  function restore() {
    const prevStateTemp = new Map(stateMap);
    /**
     * 如果是函数返回的初始化状态数据，则需要再次执行初始化函数来获取内部初始化的逻辑数据
     * 防止因为初始化函数的内部逻辑导致重置恢复的数据不符合初始化的数据逻辑
     */
    if (typeof initialState === "function") reducerState = initialState();
    
    batchUpdate(() => {
      let effectState: Partial<S> | null = null;
      prevStateTemp.forEach((_, key) => {
        const originValue = reducerState[key];
        
        const value = (stateMap.get(key) as ValueOf<S>) || originValue;
        
        // 函数跳过（因为在resy当中函数本身不允许更新也就没有变化）
        if (typeof value !== "function" && !Object.is(originValue, stateMap.get(key))) {
          resetStateMap(key, reducerState, stateMap);
          
          !effectState && (effectState = {});
          effectState[key as keyof S] = originValue;
          
          (
            (
              connectStore(
                key, initialReset, reducerState, stateMap, storeStateRefSet, storeMap,
              ).get(key) as StoreMapValue<S>
            ).get("updater") as StoreMapValueType<S>["updater"]
          )();
        }
      });
      
      effectState && batchDispatchListener(prevStateTemp, effectState, stateMap, listenerSet);
    });
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
  
  // 单个属性数据更新
  function singlePropUpdate(_: S, key: keyof S, val: ValueOf<S>) {
    willUpdatingHandle();
    taskPush(key, val, initialReset, reducerState, stateMap, storeStateRefSet, storeMap, schedulerProcessor);
    finallyBatchHandle(schedulerProcessor, prevState, stateMap, listenerSet, setStateCallbackStackArray);
    return true;
  }
  
  // setState、syncUpdate、restore、subscribe以及store代理内部数据Map的合集
  const externalMap: ExternalMapType<S> = new Map();
  
  // 给useStore的驱动更新代理
  const storeProxy = new Proxy(storeMap, {
    get(_, key: keyof S) {
      if (typeof stateMap.get(key) === "function") {
        return (stateMap.get(key) as AnyFn).bind(store);
      }
      return externalMap.get(key as keyof ExternalMapValue<S>) || (
        (
          (
            connectStore(
              key, initialReset, reducerState, stateMap, storeStateRefSet, storeMap,
            ) as StoreMap<S>
          ).get(key) as StoreMapValue<S>
        ).get("useAtomState") as StoreMapValueType<S>["useAtomState"]
      )();
    },
  } as ProxyHandler<StoreMap<S>>);
  
  externalMap.set("setState", setState);
  externalMap.set("syncUpdate", syncUpdate);
  externalMap.set("restore", restore);
  externalMap.set("subscribe", subscribe);
  externalMap.set(RESY_ID, RESY_ID);
  
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
  const conciseExtraStoreProxy = new Proxy(reducerState, {
    get(target, key: keyof S, receiver: any) {
      if (typeof stateMap.get(key) === "function") {
        return (stateMap.get(key) as AnyFn).bind(store);
      }
      return conciseExternalMap.get(key as keyof ConciseExternalMapValue<S>)
        || proxyReceiverThisHandle(receiver, conciseExtraStoreProxy, target, key, stateMap);
    },
    set: singlePropUpdate,
  } as ProxyHandler<S>) as Store<S>;
  
  conciseExternalMap.set("store", conciseExtraStoreProxy);
  
  // 给useConciseState的驱动更新代理，与useStore分离开来，避免useStore中解构读取store产生冗余
  const conciseStoreProxy = new Proxy(storeMap, {
    get(_, key: keyof S) {
      if (typeof stateMap.get(key) === "function") {
        return (stateMap.get(key) as AnyFn).bind(store);
      }
      return conciseExternalMap.get(key as keyof ConciseExternalMapValue<S>) || (
        (
          (
            connectStore(
              key, initialReset, reducerState, stateMap, storeStateRefSet, storeMap,
            ) as StoreMap<S>
          ).get(key) as StoreMapValue<S>
        ).get("useAtomState") as StoreMapValueType<S>["useAtomState"]
      )();
    },
  } as ProxyHandler<StoreMap<S>>);
  
  externalMap.set(VIEW_CONNECT_STORE_KEY, viewConnectStoreMap);
  externalMap.set(USE_STORE_KEY, storeProxy);
  externalMap.set(USE_CONCISE_STORE_KEY, conciseStoreProxy);
  
  const store = new Proxy(reducerState, {
    get(target, key: keyof S, receiver: any) {
      if (typeof stateMap.get(key) === "function") {
        return (stateMap.get(key) as AnyFn).bind(store);
      }
      return externalMap.get(key as keyof ExternalMapValue<S>)
        || proxyReceiverThisHandle(receiver, store, target, key, stateMap);
    },
    set: singlePropUpdate,
    // delete 也会起到更新作用
    deleteProperty(_: S, key: keyof S) {
      willUpdatingHandle();
      taskPush(
        key, undefined as ValueOf<S>, initialReset, reducerState,
        stateMap, storeStateRefSet, storeMap, schedulerProcessor,
      );
      finallyBatchHandle(
        schedulerProcessor,
        prevState,
        stateMap,
        listenerSet,
        setStateCallbackStackArray,
      );
      return true;
    },
    setPrototypeOf() {
      if (_RE_DEV_SY_) {
        throw new Error("Prohibit changing the prototype of the store!");
      }
      return false;
    },
  } as ProxyHandler<S>) as Store<S>;
  
  return store;
}
