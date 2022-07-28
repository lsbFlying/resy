/**
 * created by liushanbao
 * @description 一款简单易用的React数据状态管理器
 * @author liushanbao
 * @date 2022-05-05
 * @function resy
 * @name resy
 */
import useSyncExternalStoreExports from "use-sync-external-store/shim";
import scheduler from "./scheduler";
import { useResyDriveKey, storeHeartMapKey, batchUpdate } from "./static";
import {
  Callback, State, EffectState, CustomEventInterface, ResyUpdateType, StoreMap,
  StoreValueMap, StoreValueMapType, StoreHeartMapType, StoreHeartMapValueType,
} from "./model";

/**
 * 从use-sync-external-store包的导入方式到下面的引用方式
 * 是为了解决该包在ESM中的有效执行，至少目前该包不这样是解决不了ESM执行的问题
 */
const { useSyncExternalStore } = useSyncExternalStoreExports;

/** Map转Object的方法 */
function mapToObject<T>(map: Map<keyof T, T[keyof T]>): T {
  // @ts-ignore
  return [...map.entries()].reduce((obj, [key, value]) => (obj[key] = value, obj), {});
}

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
  storeHeartMap.set("getState", () => mapToObject<T>(stateMap));
  storeHeartMap.set("resetState", () => {
    if (unmountClear) stateMap = new Map(Object.entries(state));
  });
  storeHeartMap.set("listenerEventType", Symbol("storeListenerSymbol"));
  storeHeartMap.set("dispatchStoreEffectSet", new Set<CustomEventInterface<any>>());
  storeHeartMap.set("dispatchStoreEffect", (effectData: EffectState<T>, prevState: T, nextState: T) => {
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
      const prevState = mapToObject<T>(stateMap);
      stateMap.set(key, val);
      storeChanges.forEach(storeChange => storeChange());
      if (!scheduler.isBatchUpdating) {
        const nextState = mapToObject<T>(stateMap);
        const effectState = { [key]: val } as EffectState<T>;
        // 单一属性触发数据变动
        (storeHeartMap.get("dispatchStoreEffect") as StoreHeartMapValueType<T>["dispatchStoreEffect"])(effectState, prevState, nextState);
      }
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
   * @description 本质上是为了批量更新孕育而出的方法，但同样可以单次更新
   * 如果是在循环中更新，则resyUpdate的state参数可以直接给callback，在callback中写循环更新即可
   *
   * 事实上如果是react v18及以上，也可以不通过resyUpdate批量更新
   * 而直接使用store.xxx = x;单次更新的方式，因为v18及以上是自动处理批更新
   * 那么就会导致resyListener的监听有问题，会重复本该批量的key值监听触发
   *
   * 所以这里暂且不建议在v18及以上的react版本中依靠react本身自动化批处理更新
   * 除非用户看源码并且读到这里的注释😎
   * todo 该问题暂时待解决啦...😊
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
    /**
     * 减少try执行之前的耗时，这样一句变量耗时可以忽略不计，
     * 而mapToObject的计算耗时较大，会影响批量更新与单次更新的分叉逻辑
     */
    let prevState = {} as T;
    try {
      scheduler.on();
      // 必须在更新之前执行，获取更新之前的数据
      prevState = mapToObject<T>(stateMap);
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
      scheduler.off();
      const nextState = mapToObject<T>(stateMap);
      const effectState = {} as EffectState<T>;
      Object.keys(nextState).forEach((key: keyof T) => {
        if (!Object.is(nextState[key], prevState[key])) {
          effectState[key] = nextState[key];
        }
      });
      // 批量触发变动
      (storeHeartMap.get("dispatchStoreEffect") as StoreHeartMapValueType<T>["dispatchStoreEffect"])(effectState, prevState, nextState);
      callback?.(nextState);
    }
  }
  
  return new Proxy(state, {
    get: (_, key: keyof T) => {
      if (key === useResyDriveKey) {
        // 给useResy的驱动更新代理
        return new Proxy(storeMap, {
          get: (_t, tempKey: keyof T) => {
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
      if (key === "resyUpdate") return resyUpdate;
      return stateMap.get(key);
    },
    set: (_, key: keyof T, val: T[keyof T]) => {
      (initialValueLinkStore(key).get(key) as StoreValueMap<T>).get("setString")?.(val);
      return true;
    },
  } as ProxyHandler<T>) as T & ResyUpdateType<T>;
}

export * from "./utils";
export * from "./resyView";
