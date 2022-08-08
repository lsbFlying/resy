/**
 * created by liushanbao
 * @description 一款简单易用的React数据状态管理器
 * @author liushanbao
 * @date 2022-05-05
 * @function resy
 * @name resy
 */
import useSyncExternalStoreExports from "use-sync-external-store/shim";
import { scheduler, SchedulerType } from "./scheduler";
import {
  useResyDriveKey, storeHeartMapKey, batchUpdate, resyUpdateKey, resyViewNextStateMapKey,
} from "./static";
import {
  Callback, State, CustomEventInterface, ResyUpdateType, StoreMap,
  StoreValueMap, StoreValueMapType, StoreHeartMapType, StoreHeartMapValueType,
} from "./model";

/**
 * 从use-sync-external-store包的导入方式到下面的引用方式
 * 是为了解决该包在ESM中的有效执行，至少目前该包不这样是解决不了ESM执行的问题
 */
const { useSyncExternalStore } = useSyncExternalStoreExports;

/**
 * resy: react state easy
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
export function resy<T extends State>(state: T, unmountClear: boolean = true): T & ResyUpdateType<T> {
  
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
  storeHeartMap.set("dispatchStoreEffectSet", new Set<CustomEventInterface<any>>());
  storeHeartMap.set("dispatchStoreEffect", (effectData: Partial<T>, prevState: T, nextState: T) => {
    (storeHeartMap.get("dispatchStoreEffectSet") as StoreHeartMapValueType<T>["dispatchStoreEffectSet"])
    .forEach(item => item.dispatchEvent(
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
    
    const storeValueMap: StoreValueMap<T> = new Map();
    storeValueMap.set("subscribe", (storeChange: Callback) => {
      storeChanges.add(storeChange);
      return () => {
        storeChanges.delete(storeChange);
        if (unmountClear) stateMap.set(key, state[key]);
      };
    });
    storeValueMap.set("getString", () => stateMap.get(key));
    storeValueMap.set("setString", (val: T[keyof T]) => {
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
    storeValueMap.set("useString", () => useSyncExternalStore(
      (storeMap.get(key) as StoreValueMap<T>).get("subscribe") as StoreValueMapType<T>["subscribe"],
      (storeMap.get(key) as StoreValueMap<T>).get("getString") as StoreValueMapType<T>["getString"],
    ));
    
    storeMap.set(key, storeValueMap);
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
  
  /**
   * resyUpdate
   * @description 最初是为了批量更新而创建的方法
   * 后完善来resy的批处理，而resyUpdate依然保留
   * 它的使用方式以及回调依然具有很好的代码编写能力
   *
   * @example A
   * store.resyUpdate({
   *   count: 123,
   *   text: "updateText",
   * }, (state) => {
   *   // state：最新的数据值
   *   // 可以理解为this.setState中的回调中的this.state
   *   // 同时这一点也弥补了：
   *   // hook组件中setState后只能通过useEffect来获取最新数据的方式
   *   console.log(state);
   * });
   * @example B
   * store.resyUpdate(() => {
   *   store.count = 123;
   *   store.text = "updateText";
   * }, (state) => {
   *   console.log(state);
   * });
   */
  function resyUpdate(
    stateParams: Partial<T> | T | Callback = {},
    callback?: (nextState: T) => void,
  ) {
    // 必须在更新之前执行，获取更新之前的数据
    const prevState = new Map(stateMap);
    try {
      if (typeof stateParams === "function") {
        batchUpdate(stateParams as Callback);
      } else {
        batchUpdate(() => {
          Object.keys(stateParams).forEach(key => {
            (
              (initialValueLinkStore(key).get(key) as StoreValueMap<T>)
              .get("setString") as StoreValueMapType<T>["setString"]
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
   * 1、是常用
   * 2、是配合resyView的内部数据牵引更新比较时也方便
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
      storeHeartMap.get("dispatchStoreEffect") as StoreHeartMapValueType<T>["dispatchStoreEffect"]
    )(
      effectState,
      new Proxy(prevState, {
        get: (target, p: keyof T) => {
          return target.get(p);
        }
      } as ProxyHandler<Map<keyof T, T[keyof T]>>) as any as T,
      new Proxy(stateMap, {
        get: (target, p: keyof T) => {
          if (p === resyViewNextStateMapKey) return target;
          return target.get(p);
        }
      } as ProxyHandler<Map<keyof T, T[keyof T]>>) as any as T,
    );
  }
  
  return new Proxy(state, {
    get: (_, key: keyof T) => {
      if (key === useResyDriveKey) {
        // 给useResy的驱动更新代理
        return new Proxy(storeMap, {
          get: (_t, tempKey: keyof T) => {
            if (tempKey === resyUpdateKey) return resyUpdate;
            return (
              (
                (initialValueLinkStore(tempKey) as StoreMap<T>)
                .get(tempKey) as StoreValueMap<T>
              ).get("useString") as StoreValueMapType<T>["useString"]
            )();
          },
        } as ProxyHandler<StoreMap<T>>);
      }
      if (key === storeHeartMapKey) return storeHeartMap;
      if (key === resyUpdateKey) return resyUpdate;
      return stateMap.get(key);
    },
    set: (_, key: keyof T, val: T[keyof T]) => {
      (scheduler.get("add") as SchedulerType["add"])(
        () => (
          (
            initialValueLinkStore(key).get(key) as StoreValueMap<T>
          ).get("setString") as StoreValueMapType<T>["setString"]
        )(val),
        key,
        val,
      ).then(() => {
        /**
         * 巧妙的地方在于then的执行时机是在所有属性赋值语句执行之后再执行，
         * 即在如下赋值更新语句执行完之后：
         * store.x1 = xxx1;
         * store.x2 = xxx2;
         * 这刚好使得：
         * store.x1 = xxx1;
         * store.x2 = xxx2;
         * 这种形式的更新写法的批量更新得到的巧妙的处理
         * 它使得这种写法的批量更新得到实现，并且可以在任何地方得到实现
         * 这种写法不再需要借助与React本身具备的批处理实现批量更新
         * 同时可以帮助React v18以下的版本实现React管理不到的地方自动批处理更新
         */
        const prevState = new Map(stateMap);
        try {
          (scheduler.get("flush") as SchedulerType["flush"])();
        } finally {
          if (!(scheduler.get("isEmpty") as SchedulerType["isEmpty"])()) {
            batchDispatch(prevState, (scheduler.get("getTaskDataMap") as SchedulerType["getTaskDataMap"])());
            (scheduler.get("clean") as SchedulerType["clean"])();
          }
        }
      });
      return true;
    },
  } as ProxyHandler<T>) as T & ResyUpdateType<T>;
}

export * from "./utils";
export * from "./resyView";
