import {
  Callback, ResyType, ListenerHandle,
  CustomEventDispatcherInterface, StoreListener, EffectState,
} from "./model";
import {
  batchUpdate, resyAllStoreListenerEventType,
  dispatchAllStoreEffectSet, storeListenerKey, getResyStateKey,
} from "./static";
import { EventDispatcher } from "./listener";

/**
 * resyUpdate
 * @description 本质上是为了批量更新孕育而出的方法，但同样可以单次更新
 * 巧合的是React-v18中已经自动做了批处理更新，所以这里算是给v<18以下的React版本做一个兼容吧
 * 如果是在循环中更新，则resyUpdate直接给callback，在callback中写循环更新即可
 * @example A1
 * resyUpdate(() => {
 *   store.count = 123;
 *   store.text = "updateText";
 * });
 * @example B1
 * resyUpdate(store, {
 *   count: 123,
 *   text: "updateText",
 * });
 * @example B2
 * resyUpdate(store, {
 *   count: 123,
 *   text: "updateText",
 * }, (dStore) => {
 *   // dStore：即deconstructedStore，已解构的数据，可安全使用
 *   console.log(dStore);
 * });
 */
export function resyUpdate<T extends ResyType>(
  store: T | Callback,
  state: Partial<T> | T = {},
  callback?: (dStore: T) => void,
) {
  if (typeof store === "function") {
    batchUpdate(store as Callback);
    return;
  }
  batchUpdate(() => {
    Object.keys(state).forEach(key => {
      (store as any)[key] = (state as Partial<T> | T)[key];
    });
  });
  typeof store !== "function" && callback?.(store[getResyStateKey]);
}

/**
 * resySyncState
 * @description 为了解决hooks调用时序规则的问题，去除try catch的使用
 */
export function resySyncState<T extends ResyType>(store: T): T {
  return store[getResyStateKey] as T;
}

/**
 * resyListener
 * @description 监听订阅，类似subscribe/addEventListener，但是这里对应的数据的变化监听订阅
 * resyListener的存在是必要的，它的作用并不类比于useEffect，
 * 而是像subscribe或者addEventListener的效果，监听订阅数据的变化
 * 不会像effect那样初始化执行一次，且核心关键点在于它可以监听不同store的数据变化
 * 并且它是更具数据的变化才触发执行，并不会像useEffect那样进行数据前后的对比
 *
 * 本质上我是写了一个监听事件，而在resy里面的数据更新的情况下触发了这个监听的dispatch
 * 其实这里的监听订阅还可以使用proxy进行拦截监听，但是并没有使用这种方式
 * 因为resy产生的store数据存储本身就已经是proxy了，而proxy本身是有一定内存消耗的
 * 对性能而言有一定的考量因素，这里在resy已经使用了proxy拦截监听之后配合函数监听是更好的选择
 *
 * 如果是监听所有resy产生的store的情况下，由于泛型的困扰，
 * 导致resyListener中的回调函数中的effectData的类型判别较为不便
 * 但如果传入了store监听具体某一个store的变化则可以自动识别类型
 *
 * 暂未实现批量触发监听订阅，所以目前如果传入listenerKey是针对某一个store的数据字段属性
 * 是因为resy的实现方式不擅长批量处理，如果要实现它需要拿到react本身内部调度的状态
 * 难度复杂度有所增加，带来的收益效能并不高，因为仅仅订阅功能而言本身并不需要多么复杂的使用场景
 * 且相较于其他的状态管理器如redux，它的订阅设计甚至没有某一个数据属性key的支持
 * 而resyListener与valtio一样具备对某一个store的某一个数据属性key字段的变化监听订阅
 * 就目前而言其功能使用基本完备，后续如果确实有强烈的批量处理监听的必要再考量完善
 *
 * @param listener 监听订阅的回调函数
 * @param store 监听订阅的具体的某一个store容器，
 * 如果没有则默认监听resy产生的所有store的变化，但是常规而言理论上我们一般不会这样监听所有store数据的变化
 * @param listenerKey 监听订阅的具体的某一个store容器的某一个字段数据变化，存在store参数的前提下生效
 * @return Callback 返回取消监听的函数
 */
export function resyListener<T extends ResyType>(
  listener: ListenerHandle<T>,
  store?: T,
  listenerKey?: keyof T,
) {
  const resyListenerHandle = (): Callback => {
    const resyListenerEventType = store && typeof store === "object"
      ? (store[storeListenerKey] as StoreListener).listenerEventType
      : resyAllStoreListenerEventType;
    
    const dispatchStoreEffectSet = store && typeof store === "object"
      ? (store[storeListenerKey] as StoreListener).dispatchStoreEffectSet
      : dispatchAllStoreEffectSet;
    
    const listenerOrigin = (effectState: EffectState<T>, prevState: T, nextState: T) => {
      let includesFlag = true;
      if (listenerKey) {
        const effectStateFields = Object.keys(effectState);
        if (listenerKey !== effectStateFields[0]) {
          includesFlag = false;
        }
      }
      if (!listenerKey || (listenerKey && includesFlag)) {
        listener(effectState, prevState, nextState);
      }
    }
    
    const customEventDispatcher: CustomEventDispatcherInterface<T> = new (EventDispatcher as any)();
    customEventDispatcher.addEventListener(resyListenerEventType, listenerOrigin);
    dispatchStoreEffectSet.add(customEventDispatcher);
    
    return () => {
      dispatchStoreEffectSet.forEach(item => {
        if (item === customEventDispatcher) item.removeEventListener(resyListenerEventType)
      });
      dispatchStoreEffectSet.delete(customEventDispatcher);
    };
  };
  return resyListenerHandle();
}
