/**
 * created by liushanbao
 * @description 一款简单易用的React数据状态管理器
 * @author liushanbao
 * @date 2022-05-05
 * @name createStore
 */
import scheduler from "./scheduler";
import {
  batchUpdate, VIEW_CONNECT_STORE_KEY, USE_STORE_KEY, USE_CONCISE_STORE_KEY, RESY_ID,
} from "./static";
import {
  stateErrorHandle, mapToObject, objectToMap, protoPointStoreErrorHandle, followUpMap,
} from "./utils";
import {
  genViewConnectStoreMap, connectStore, batchDispatchListener,
  taskPush, finallyBatchHandle, willUpdatingHandle,
} from "./reduce";
import type {
  ExternalMapType, ExternalMapValue, PrimitiveState, StateFuncType, StoreMap, StoreMapValue,
  StoreMapValueType, Unsubscribe, Listener, CreateStoreOptions, Store, AnyFn,
  ConciseExternalMapType, ConciseExternalMapValue, SetStateCallback, SetStateCallbackItem,
  MapType, ValueOf, State, StoreStateRestoreOkMapType,
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
export function createStore<S extends PrimitiveState>(
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
   * storeStateRef的引用清空的状态对应了整个store的数据状态的恢复到初始化的情况，
   * 这里是恢复初始化成功与否的开关标识，以防止代码多次执行重复的动作，减轻冗余负担
   */
  const storeStateRestoreOkMap: StoreStateRestoreOkMapType = new Map();
  
  /**
   * @description 由于proxy读取数据本身相较于原型链读取数据要慢，
   * 所以在不改变传参state的情况下，同时resy使用Map与Set提升性能，来弥补proxy的性能缺陷
   * 同时更重要的是转换给map，做一层引用类型数据的安全保护层，
   * 这样即使外部的initialState数据的引用数据恶意错误变化，也不会影响内部map数据的恶意变化
   */
  const stateMap: MapType<S> = objectToMap(reducerState);
  // 由于stateMap的设置前置了，优化了同步数据的获取，但是对于之前的数据状态也会需要前置处理
  const prevState: MapType<S> = objectToMap(reducerState);
  
  /**
   * setState的回调函数执行栈数组
   * 用Array没有用Set或者Map是因为内部需要用索引index
   */
  const setStateCallbackStackArray: SetStateCallbackItem<S>[] = [];
  
  // 订阅监听Set容器
  const listenerSet = new Set<Listener<S>>();
  
  // 处理view连接store、以及获取最新state数据的相关处理Map
  const viewConnectStoreMap = genViewConnectStoreMap(
    initialReset, reducerState, stateMap, storeStateRefSet, storeStateRestoreOkMap,
  );
  
  // 数据存储容器storeMap
  const storeMap: StoreMap<S> = new Map();
  
  /**
   * 同步更新
   * @description todo 更多意义上是为了解决input无法输入非英文语言bug的无奈，后续待优化setState与单次更新
   */
  function syncUpdate(state: State<S> | StateFuncType<S>) {
    let stateTemp = state;
    if (typeof state === "function") {
      stateTemp = (state as StateFuncType<S>)(mapToObject(prevState));
    }
    
    if (stateTemp === null) return;
    
    stateErrorHandle(stateTemp, "syncUpdate");
    
    const prevStateTemp: MapType<S> = followUpMap(stateMap);
    batchUpdate(() => {
      let effectState: Partial<S> | null = null;
      Object.keys(stateTemp as NonNullable<State<S>>).forEach(key => {
        const val = (stateTemp as Partial<S> | S)[key];
        
        if (!Object.is(val, stateMap.get(key))) {
          stateMap.set(key, val);
          !effectState && (effectState = {});
          effectState[key as keyof S] = val;
          (
            (
              connectStore(
                key, initialReset, reducerState, stateMap, storeStateRefSet, storeMap, storeStateRestoreOkMap,
              ).get(key) as StoreMapValue<S>
            ).get("updater") as StoreMapValueType<S>["updater"]
          )();
        }
      });
      effectState && batchDispatchListener(prevStateTemp, effectState, stateMap, listenerSet);
    });
  }
  
  // 可对象数据更新的函数
  function setState(state: State<S> | StateFuncType<S>, callback?: SetStateCallback<S>) {
    // 调度处理器内部的willUpdating需要在更新之前开启，这里不管是否有变化需要更新，
    // 先打开缓存一下prevState方便后续订阅事件的触发执行
    willUpdatingHandle(schedulerProcessor, prevState, stateMap);
    
    let stateTemp = state;
    
    if (typeof state === "function") {
      stateTemp = (state as StateFuncType<S>)(mapToObject(prevState as MapType<S>));
    }
    
    if (stateTemp !== null) {
      stateErrorHandle(stateTemp, "setState");
      
      // 更新添加入栈，后续统一批次合并更新
      Object.keys(stateTemp as NonNullable<State<S>>).forEach(key => {
        taskPush(
          key, (stateTemp as S)[key], initialReset, reducerState, stateMap,
          storeStateRefSet, storeMap, schedulerProcessor, storeStateRestoreOkMap,
        );
      });
    }
    
    // 异步回调添加入栈
    if (callback) {
      const nextState: S = Object.assign({}, mapToObject(stateMap), stateTemp);
      /**
       * 如果是回调在执行时发现回调中有更setState并且有回调，
       * 此时回调进入下一个微任务循环中添加入栈，不影响这一轮的回调执行栈的执行
       */
      schedulerProcessor.get("isCalling")
        ? Promise.resolve().then(() => {
          setStateCallbackStackArray.push({ cycleState: nextState, callback });
        })
        : setStateCallbackStackArray.push({ cycleState: nextState, callback });
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
        
        if (!Object.is(originValue, stateMap.get(key))) {
          Object.prototype.hasOwnProperty.call(reducerState, key)
            ? stateMap.set(key, reducerState[key])
            : stateMap.delete(key);
          
          !effectState && (effectState = {});
          effectState[key as keyof S] = originValue;
          
          (
            (
              connectStore(
                key, initialReset, reducerState, stateMap, storeStateRefSet, storeMap, storeStateRestoreOkMap,
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
    willUpdatingHandle(schedulerProcessor, prevState, stateMap);
    taskPush(
      key, val, initialReset, reducerState, stateMap, storeStateRefSet,
      storeMap, schedulerProcessor, storeStateRestoreOkMap,
    );
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
              key, initialReset, reducerState, stateMap, storeStateRefSet, storeMap, storeStateRestoreOkMap,
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
  
  const conciseExternalMap = followUpMap(externalMap) as ConciseExternalMapType<S>;
  
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
    get(_, key: keyof S, receiver: any) {
      protoPointStoreErrorHandle(receiver, conciseExtraStoreProxy);
      
      if (typeof stateMap.get(key) === "function") {
        return (stateMap.get(key) as AnyFn).bind(store);
      }
      
      return conciseExternalMap.get(key as keyof ConciseExternalMapValue<S>) || stateMap.get(key);
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
              key, initialReset, reducerState, stateMap, storeStateRefSet, storeMap, storeStateRestoreOkMap,
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
    get(_, key: keyof S, receiver: any) {
      protoPointStoreErrorHandle(receiver, store);
      
      if (typeof stateMap.get(key) === "function") {
        return (stateMap.get(key) as AnyFn).bind(store);
      }
      
      return externalMap.get(key as keyof ExternalMapValue<S>) || stateMap.get(key);
    },
    set: singlePropUpdate,
    // delete 也会起到更新作用
    deleteProperty(_: S, key: keyof S) {
      return singlePropUpdate(_, key, undefined as ValueOf<S>);
    },
  } as ProxyHandler<S>) as Store<S>;
  
  return store;
}
