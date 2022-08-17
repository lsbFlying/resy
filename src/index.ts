/**
 * created by liushanbao
 * @description 一款简单易用的React数据状态管理器
 * @author liushanbao
 * @date 2022-05-05
 * @function createStore
 * @name createStore
 */
import useSyncExternalStoreExports from "use-sync-external-store/shim";
import { scheduler, Scheduler } from "./scheduler";
import {
  useStateKey, storeHeartMapKey, batchUpdate, setStateKey, pureViewNextStateMapKey, subscribeKey,
} from "./static";
import {
  Callback, State, SetState, StoreMap, StoreMapValue, StoreMapValueType, StoreHeartMapType,
  StoreHeartMapValue, StateFunc, Unsubscribe, Subscribe,
} from "./model";
import { CustomEventListener, EventDispatcher, Listener } from "./listener";

/**
 * 从use-sync-external-store包的导入方式到下面的引用方式
 * 是为了解决该包在ESM中的有效执行，至少目前该包不这样是解决不了ESM执行的问题
 */
const { useSyncExternalStore } = useSyncExternalStoreExports;

/**
 * createStore
 * created by liushanbao
 * @description 初始化状态编写的时候最好加上一个自定义的准确的泛型类型，
 * 虽然resy会有类型自动推断，但是对于数据状态类型可能变化的情况下还是不够准确的
 * @author liushanbao
 * @date 2022-05-05
 * @param state
 * @param unmountClear
 * @description unmountClear参数主要是为了在某模块卸载的时候自动清除初始化数据，恢复数据为初始化传入的state数据
 * 之所以会有unmountClear这样的参数设计是因为resy为了极简的使用便利性，一般是放在某个文件中进行调用返回一个store
 * 但是之后再进入该模块之后都是走的Node.js的import的缓存了，即没有再次执行resy方法了导致数据状态始终保持
 * 也就是在 "静态模板" 的实现方式下，函数是不会再次运行的
 * 但这不是一个坏事儿，因为本身store作为一个全局范围内可控可引用的状态存储器而言，具备这样的能力是有益的
 * 比如登录后的用户信息数据作为一个全局模块都可公用分享的数据而言就很好的体现了这一点
 * 但这种全局真正公用分享的数据是相对而言少数的，大部分情况下是没那么多要全局分享公用的数据的
 * 所以unmountClear默认设置为true，符合常规使用即可，除非遇到像上述登录信息数据那样的全局数据而言才会设置为false
 */
export function createStore<T extends State>(state: T, unmountClear = true): T & SetState<T> & Subscribe<T> {
  
  /**
   * 不改变传参state，同时resy使用Map与Set提升性能
   * 如stateMap、storeMap、storeHeartMap、storeChanges等
   */
  let stateMap: Map<keyof T, T[keyof T]> = new Map(Object.entries(state));
  
  // 每一个resy生成的store具有的监听订阅处理，并且可以获取最新state数据，像心脏一样核心重要
  const storeHeartMap: StoreHeartMapType<T> = new Map();
  storeHeartMap.set("getState", () => stateMap);
  storeHeartMap.set("resetState", () => {
    if (unmountClear) stateMap = new Map(Object.entries(state));
  });
  storeHeartMap.set("listenerEventType", Symbol("storeListenerSymbol"));
  storeHeartMap.set("dispatchStoreEffectSet", new Set<CustomEventListener<any>>());
  storeHeartMap.set("dispatchStoreEffect", (effectData: Partial<T>, prevState: T, nextState: T) => {
    (
      storeHeartMap.get("dispatchStoreEffectSet") as StoreHeartMapValue<T>["dispatchStoreEffectSet"]
    ).forEach(item => item.dispatchEvent(
      storeHeartMap.get("listenerEventType") as string | symbol,
      effectData,
      prevState,
      nextState,
    ));
  });
  
  // 数据存储容器storeMap
  const storeMap: StoreMap<T> = new Map();
  
  // 生成storeMap键值对
  function genStoreMapKeyValue(key: keyof T) {
    /**
     * 这里使用set不使用纯对象或者数组的原因很简单：
     * 就是Set或者Map类型在频繁添加和删除元素的情况下有明显的性能优势
     */
    const storeChanges = new Set<Callback>();
    
    const StoreMapValue: StoreMapValue<T> = new Map();
    StoreMapValue.set("subscribe", (storeChange: Callback) => {
      storeChanges.add(storeChange);
      return () => {
        storeChanges.delete(storeChange);
        if (unmountClear) stateMap.set(key, state[key]);
      };
    });
    StoreMapValue.set("getString", () => stateMap.get(key));
    StoreMapValue.set("setString", (val: T[keyof T]) => {
      /**
       * 考虑极端复杂的情况下业务逻辑有需要更新某个数据为函数，或者本身函数也有变更
       * 同时使用Object.is避免一些特殊情况，虽然实际业务上设置值为NaN/+0/-0的情况并不多见
       */
      if (Object.is(val, stateMap.get(key))) return;
      // 这一步是为了配合getString，使得getString可以获得最新值
      stateMap.set(key, val);
      // 这一步才是真正的更新数据，通过useSyncExternalStore的内部变动后强制更新来刷新数据驱动页面更新
      storeChanges.forEach(storeChange => storeChange());
    });
    StoreMapValue.set("useString", () => useSyncExternalStore(
      (storeMap.get(key) as StoreMapValue<T>).get("subscribe") as StoreMapValueType<T>["subscribe"],
      (storeMap.get(key) as StoreMapValue<T>).get("getString") as StoreMapValueType<T>["getString"],
    ));
    
    storeMap.set(key, StoreMapValue);
  }
  
  // 为每一个数据字段储存链接到store容器中，这样渲染并发执行提升渲染流畅度
  function initialValueLinkStore(key: keyof T) {
    // 解决初始化属性泛型有?判断符导致store[key]为undefined的问题
    if (storeMap.get(key) === undefined) {
      genStoreMapKeyValue(key);
      return storeMap;
    }
    return storeMap;
  }
  
  // 详细注释描述见model文件SetStateType接口类型文档描述
  function setState(
    stateParams: Partial<T> | T | StateFunc = {},
    callback?: (nextState: T) => void,
  ) {
    // 必须在更新之前执行，获取更新之前的数据
    const prevState = new Map(stateMap);
    try {
      if (typeof stateParams === "function") {
        batchUpdate(stateParams as StateFunc);
      } else {
        batchUpdate(() => {
          Object.keys(stateParams).forEach(key => {
            (
              (
                initialValueLinkStore(key).get(key) as StoreMapValue<T>
              ).get("setString") as StoreMapValueType<T>["setString"]
            )((stateParams as Partial<T> | T)[key]);
          });
        });
      }
    } finally {
      const changedData = typeof stateParams === "function" ? stateMap : new Map(Object.entries(stateParams));
      batchDispatch(prevState, changedData);
      callback?.(
        new Proxy(stateMap, {
          get: (target, p: keyof T) => {
            return target.get(p);
          }
        } as ProxyHandler<Map<keyof T, T[keyof T]>>) as any as T
      );
    }
  }
  
  /**
   * 批量触发订阅监听的数据变动
   * prevState与nextState使用proxy出于两点考虑：
   * 1、使用map转object效率更块
   * 2、这两者数据实际上使用程度比较少，本身常用的时effectState
   * 之所以effectState采用对象设计：
   * 1、常用几率较大，如果使用subscribe必然是常规使用业务逻辑
   * 2、配合pureView的内部数据牵引更新比较时方便，是不二之选
   * 3、是changedData本身是部分变更数据不会很多，不怎么影响效率
   */
  function batchDispatch(prevState: Map<keyof T, T[keyof T]>, changedData: Map<keyof T, T[keyof T]>) {
    /**
     * effectState：实际真正影响变化的数据
     * changedData是给予更新变化的数据，但是不是真正会产生变化影响的数据，
     * 就好比setState中的参数对象可以写与原数据一样数据，但是不产生更新
     */
    const effectState = {} as Partial<T>;
    // @ts-ignore
    [...changedData.entries()].forEach(([key, value]) => {
      if (!Object.is(value, prevState.get(key))) {
        effectState[key as keyof T] = stateMap.get(key);
      }
    });
    
    (
      storeHeartMap.get("dispatchStoreEffect") as StoreHeartMapValue<T>["dispatchStoreEffect"]
    )(
      effectState,
      new Proxy(prevState, {
        get: (target, p: keyof T) => {
          return target.get(p);
        }
      } as ProxyHandler<Map<keyof T, T[keyof T]>>) as any as T,
      new Proxy(stateMap, {
        get: (target, p: keyof T) => {
          if (p === pureViewNextStateMapKey) return target;
          return target.get(p);
        }
      } as ProxyHandler<Map<keyof T, T[keyof T]>>) as any as T,
    );
  }
  
  /**
   * subscribe
   * @description 监听订阅，类似subscribe/addEventListener，但是这里对应的数据的变化监听订阅
   * subscribe的存在是必要的，它的作用并不类比于useEffect，
   * 而是像subscribe或者addEventListener的效果，监听订阅数据的变化
   * 具备多数据订阅监听的能力
   *
   * @param listener 监听订阅的回调函数
   * @param stateKeys 监听订阅的具体的某一个store容器的某些数据变化，
   * 如果为空则默认监听store的任何一个数据的变化
   * @return unsubscribe 返回取消监听的函数
   */
  function subscribe(
    listener: Listener<T>,
    stateKeys?: (keyof T)[],
  ): Unsubscribe {
    const subscribeEventType = storeHeartMap.get("listenerEventType") as StoreHeartMapValue<T>["listenerEventType"];
    
    const dispatchStoreEffectSetTemp = storeHeartMap.get("dispatchStoreEffectSet") as StoreHeartMapValue<T>["dispatchStoreEffectSet"];
    
    const listenerOrigin = (
      effectState: Partial<Omit<T, "setState" | "subscribe">>,
      prevState: Omit<T, "setState" | "subscribe">,
      nextState: Omit<T, "setState" | "subscribe">,
    ) => {
      let includesFlag = false;
      const listenerKeysIsEmpty = stateKeys === undefined || !(stateKeys && stateKeys.length !== 0);
      if (!listenerKeysIsEmpty) {
        const effectStateFields = Object.keys(effectState);
        if (effectStateFields.some(key => stateKeys.includes(key))) includesFlag = true;
      }
      if (listenerKeysIsEmpty || (!listenerKeysIsEmpty && includesFlag)) listener(effectState, prevState, nextState);
    }
    
    const customEventDispatcher: CustomEventListener<T> = new (EventDispatcher as any)();
    customEventDispatcher.addEventListener(subscribeEventType, listenerOrigin);
    dispatchStoreEffectSetTemp.add(customEventDispatcher);
    
    return () => {
      dispatchStoreEffectSetTemp.forEach(item => {
        if (item === customEventDispatcher) item.removeEventListener(subscribeEventType)
      });
      dispatchStoreEffectSetTemp.delete(customEventDispatcher);
    };
  }
  
  return new Proxy(state, {
    get: (_, key: keyof T) => {
      if (key === useStateKey) {
        // 给useState的驱动更新代理
        return new Proxy(storeMap, {
          get: (_t, tempKey: keyof T) => {
            return (
              (
                (
                  initialValueLinkStore(tempKey) as StoreMap<T>
                ).get(tempKey) as StoreMapValue<T>
              ).get("useString") as StoreMapValueType<T>["useString"]
            )();
          },
        } as ProxyHandler<StoreMap<T>>);
      }
      if (key === storeHeartMapKey) return storeHeartMap;
      if (key === setStateKey) return setState;
      if (key === subscribeKey) return subscribe;
      return stateMap.get(key);
    },
    set: (_, key: keyof T, val: T[keyof T]) => {
      (scheduler.get("add") as Scheduler["add"])(
        () => (
          (
            initialValueLinkStore(key).get(key) as StoreMapValue<T>
          ).get("setString") as StoreMapValueType<T>["setString"]
        )(val),
        key,
        val,
      ).then(() => {
        /**
         * 借助then的事件循环实现数据与任务更新的执行都统一入栈，然后冲刷更新
         * 同时可以帮助React v18以下的版本实现React管理不到的地方自动批处理更新
         */
        const prevState = new Map(stateMap);
        try {
          (scheduler.get("flush") as Scheduler["flush"])();
        } finally {
          if (!((scheduler.get("isEmpty") as Scheduler["isEmpty"])())) {
            batchDispatch(prevState, (scheduler.get("getTaskDataMap") as Scheduler["getTaskDataMap"])());
            (scheduler.get("clean") as Scheduler["clean"])();
          }
        }
      });
      return true;
    },
  } as ProxyHandler<T>) as T & SetState<T> & Subscribe<T>;
}

/**
 * useState
 * @description 驱动组件更新的hook，使用store容器中的数据
 */
export function useState<T extends State>(store: T): T {
  return store[useStateKey as keyof T];
}

export * from "./pureView";
