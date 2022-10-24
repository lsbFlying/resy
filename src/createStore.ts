/**
 * created by liushanbao
 * @description 一款简单易用的React数据状态管理器
 * @author liushanbao
 * @date 2022-05-05
 * @function createStore
 * @name createStore
 */
import useSyncExternalStoreExports from "use-sync-external-store/shim";
import scheduler from "./scheduler";
import EventDispatcher from "./listener";
import { batchUpdate, storeCoreMapKey, useStoreKey } from "./static";
import {
  Callback, ExternalMapType, ExternalMapValue, SetState, State, StateFunc, StoreCoreMapType,
  StoreCoreMapValue, StoreMap, StoreMapValue, StoreMapValueType, Subscribe, Unsubscribe,
  Scheduler, CustomEventListener, Listener,
} from "./model";
import { mapToObject } from "./utils";

/**
 * 从use-sync-external-store包的导入方式到下面的引用方式
 * 是为了解决该包在ESM中的有效执行，因为use-sync-external-store这个包最终打包只导出了CJS
 * 等use-sync-external-store什么时候更新版本导出ESM模块的时候再更新吧
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
   * 如stateMap、storeMap、storeCoreMap、storeChanges等
   */
  let stateMap: Map<keyof T, T[keyof T]> = new Map(Object.entries(state));
  
  // 每一个resy生成的store具有的监听订阅处理，并且可以获取最新state数据
  const storeCoreMap: StoreCoreMapType<T> = new Map();
  storeCoreMap.set("getState", () => stateMap);
  storeCoreMap.set("setHookFieldsValue", (hookInitialState: Partial<T>) => {
    for (const key in hookInitialState) {
      if (stateMap.get(key) === undefined && Object.prototype.hasOwnProperty.call(hookInitialState, key)) {
        stateMap.set(key, hookInitialState[key] as T[keyof T]);
      }
    }
  });
  storeCoreMap.set("resetState", () => {
    if (unmountClear) stateMap = new Map(Object.entries(state));
  });
  storeCoreMap.set("listenerEventType", Symbol("storeListenerSymbol"));
  storeCoreMap.set("dispatchStoreEffectSet", new Set<CustomEventListener<any>>());
  storeCoreMap.set("dispatchStoreEffect", (effectData: Partial<T>, prevState: T, nextState: T) => {
    (
      storeCoreMap.get("dispatchStoreEffectSet") as StoreCoreMapValue<T>["dispatchStoreEffectSet"]
    ).forEach(item => item.dispatchEvent(
      storeCoreMap.get("listenerEventType") as string | symbol,
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
    
    const storeMapValue: StoreMapValue<T> = new Map();
    storeMapValue.set("subscribe", (storeChange: Callback) => {
      storeChanges.add(storeChange);
      return () => {
        storeChanges.delete(storeChange);
        if (unmountClear) stateMap.set(key, state[key]);
      };
    });
    storeMapValue.set("getSnapshot", () => stateMap.get(key));
    storeMapValue.set("setSnapshot", (val: T[keyof T]) => {
      /**
       * 考虑极端复杂的情况下业务逻辑有需要更新某个数据为函数，或者本身函数也有变更
       * 同时使用Object.is避免一些特殊情况，虽然实际业务上设置值为NaN/+0/-0的情况并不多见
       */
      if (!Object.is(val, stateMap.get(key))) {
        // 这一步是为了配合getSnapshot，使得getSnapshot可以获得最新值
        stateMap.set(key, val);
        // 这一步才是真正的更新数据，通过useSyncExternalStore的内部变动后强制更新来刷新数据驱动页面更新
        storeChanges.forEach(storeChange => storeChange());
      }
    });
    storeMapValue.set("useSnapshot", () => useSyncExternalStore(
      (storeMap.get(key) as StoreMapValue<T>).get("subscribe") as StoreMapValueType<T>["subscribe"],
      (storeMap.get(key) as StoreMapValue<T>).get("getSnapshot") as StoreMapValueType<T>["getSnapshot"],
    ));
    
    storeMap.set(key, storeMapValue);
  }
  
  // 详细注释描述见model文件SetState接口类型文档描述
  function setState(stateParams: Partial<T> | T | StateFunc = {}, callback?: (nextState: T) => void) {
    const taskDataMap = (scheduler.get("getTaskDataMap") as Scheduler["getTaskDataMap"])();
    // 防止直接更新与setState混用导致直接更新滞后产生的数据未及时得到更新的问题
    if (taskDataMap.size !== 0) {
      (scheduler.get("flush") as Scheduler["flush"])();
    }
    // 必须在更新之前执行，获取更新之前的数据
    const prevState = new Map(stateMap);
    if (typeof stateParams === "function") {
      batchUpdate(stateParams as StateFunc);
    } else {
      batchUpdate(() => {
        Object.keys(stateParams).forEach(key => {
          (
            (
              initialValueLinkStore(key).get(key) as StoreMapValue<T>
            ).get("setSnapshot") as StoreMapValueType<T>["setSnapshot"]
          )((stateParams as Partial<T> | T)[key]);
        });
      });
    }
    const changedData = typeof stateParams === "function" ? stateMap : new Map(Object.entries(stateParams));
    batchDispatch(prevState, changedData);
    callback?.(mapToObject(stateMap));
  }
  
  // 批量触发订阅监听的数据变动
  function batchDispatch(prevState: Map<keyof T, T[keyof T]>, changedData: Map<keyof T, T[keyof T]>) {
    if (changedData.size > 0 && (storeCoreMap.get("dispatchStoreEffectSet") as StoreCoreMapValue<T>["dispatchStoreEffectSet"]).size > 0) {
      /**
       * effectState：实际真正影响变化的数据
       * changedData是给予更新变化的数据，但是不是真正会产生变化影响的数据，
       * 就好比setState中的参数对象可以写与原数据一样数据，但是不产生更新
       */
      const effectState = {} as Partial<T>;
      
      [...changedData.entries()].forEach(([key, value]) => {
        if (!Object.is(value, prevState.get(key))) {
          effectState[key as keyof T] = stateMap.get(key);
        }
      });
      
      if (Object.keys(effectState).length !== 0) {
        (
          storeCoreMap.get("dispatchStoreEffect") as StoreCoreMapValue<T>["dispatchStoreEffect"]
        )(effectState, mapToObject(prevState), mapToObject(stateMap));
      }
    }
  }
  
  /**
   * subscribe
   * @description 监听订阅，类似subscribe/addEventListener，但是这里对应的数据的变化监听订阅
   * subscribe的存在是必要的，它的作用并不类比于useEffect，
   * 而是像subscribe或者addEventListener的效果，监听订阅数据的变化
   * 具备多数据订阅监听的能力
   *
   * @param listener 监听订阅的回调函数
   * @param stateKeys 监听订阅的具体的某一个store容器的某些数据变化，如果为空则默认监听store的任何一个数据的变化
   * @return unsubscribe 返回取消监听的函数
   */
  function subscribe(listener: Listener<T>, stateKeys?: (keyof T)[]): Unsubscribe {
    const subscribeEventType = storeCoreMap.get("listenerEventType") as StoreCoreMapValue<T>["listenerEventType"];
    
    const dispatchStoreEffectSetTemp = storeCoreMap.get("dispatchStoreEffectSet") as StoreCoreMapValue<T>["dispatchStoreEffectSet"];
    
    const listenerOrigin = (
      effectState: Partial<Omit<T, keyof SetState<T> | keyof Subscribe<T>>>,
      prevState: Omit<T, keyof SetState<T> | keyof Subscribe<T>>,
      nextState: Omit<T, keyof SetState<T> | keyof Subscribe<T>>,
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
      dispatchStoreEffectSetTemp.delete(customEventDispatcher);
    };
  }
  
  // 为每一个数据字段储存链接到store容器中
  function initialValueLinkStore(key: keyof T) {
    // 解决初始化属性泛型有?判断符导致store[key]为undefined的问题
    if (storeMap.get(key) !== undefined) return storeMap;
    genStoreMapKeyValue(key);
    return storeMap;
  }
  
  // 给useStore的驱动更新代理
  const storeMapProxy = new Proxy(storeMap, {
    get: (_, key: keyof T) => {
      return externalMap.get(key as keyof ExternalMapValue<T>) || (
        (
          (
            initialValueLinkStore(key) as StoreMap<T>
          ).get(key) as StoreMapValue<T>
        ).get("useSnapshot") as StoreMapValueType<T>["useSnapshot"]
      )();
    },
  } as ProxyHandler<StoreMap<T>>);
  
  // setState与subscribe以及store代理内部数据Map的合集
  const externalMap: ExternalMapType<T> = new Map();
  externalMap.set("setState", setState);
  externalMap.set("subscribe", subscribe);
  externalMap.set(storeCoreMapKey, storeCoreMap);
  externalMap.set(useStoreKey, storeMapProxy);
  
  return new Proxy(state, {
    get: (_, key: keyof T) => {
      return externalMap.get(key as keyof ExternalMapValue<T>) || stateMap.get(key);
    },
    set: (_, key: keyof T, val: T[keyof T]) => {
      (scheduler.get("add") as Scheduler["add"])(
        () => (
          (
            initialValueLinkStore(key).get(key) as StoreMapValue<T>
          ).get("setSnapshot") as StoreMapValueType<T>["setSnapshot"]
        )(val),
        key,
        val,
      ).then(() => {
        /**
         * 借助then的事件循环实现数据与任务更新的执行都统一入栈，然后冲刷更新
         * 同时可以帮助React v18以下的版本实现React管理不到的地方自动批处理更新
         * 但是异步更新的批量处理也导致无法立即获取最新数据
         * 如果想要立即同步获取最新数据可以使用setState的回调
         * 由此可见为了实现批量更新与同步获取最新数据有点拆东墙补西墙的味道
         * 但好在setState的回调弥补了同步获取最新数据的问题
         */
        const taskDataMap = (scheduler.get("getTaskDataMap") as Scheduler["getTaskDataMap"])();
        if (taskDataMap.size !== 0) {
          const prevState = new Map(stateMap);
          (scheduler.get("flush") as Scheduler["flush"])();
          batchDispatch(prevState, taskDataMap);
        }
      });
      return true;
    },
  } as ProxyHandler<T>) as T & SetState<T> & Subscribe<T>;
}
