import scheduler from "./scheduler";
import {
  Callback, ResyType, ListenerHandle,
  CustomEventInterface, StoreListener, EffectState,
} from "./model";
import { batchUpdate, storeListenerKey, getResySyncStateKey } from "./static";
import { EventDispatcher } from "./listener";

/**
 * resyUpdate
 * @description 本质上是为了批量更新孕育而出的方法，但同样可以单次更新
 * 如果是在循环中更新，则resyUpdate的state参数可以直接给callback，在callback中写循环更新即可
 * todo 事实上如果是react v18及以上，也可以不通过resyUpdate批量更新
 * todo 而直接使用store.xxx = x;单次更新的方式，因为v18及以上是自动处理批更新
 * todo 那么就会导致resyListener的监听有问题，会重复本该批量的key值监听触发
 * todo 这个问题待解决...
 *
 * @example A
 * resyUpdate(store, {
 *   count: 123,
 *   text: "updateText",
 * }, (dStore) => {
 *   // dStore：即deconstructedStore，已解构的数据，可安全使用
 *   console.log(dStore);
 * });
 * @example B
 * resyUpdate(store, () => {
 *   store.count = 123;
 *   store.text = "updateText";
 * }, (dStore) => {
 *   // dStore：即deconstructedStore，已解构的数据，可安全使用
 *   console.log(dStore);
 * });
 */
export function resyUpdate<T extends ResyType>(
  store: T,
  state: Partial<T> | T | Callback = {},
  callback?: (dStore: T) => void,
) {
  const prevState = Object.assign({}, store[getResySyncStateKey as keyof T]);
  try {
    scheduler.on();
    if (typeof state === "function") {
      batchUpdate(state);
    } else {
      batchUpdate(() => {
        Object.keys(state).forEach(key => {
          (store as any)[key] = (state as Partial<T> | T)[key];
        });
      });
    }
  } finally {
    scheduler.off();
  }
  const nextState = Object.assign({}, store[getResySyncStateKey as keyof T]);
  
  const effectState = {} as EffectState<T>;
  Object.keys(nextState).forEach((key: keyof T) => {
    if (!Object.is(nextState[key], prevState[key])) {
      effectState[key] = nextState[key];
    }
  });
  // 批量触发变动
  (store[storeListenerKey as keyof T] as StoreListener).dispatchStoreEffect(effectState, prevState, nextState);
  
  callback?.(nextState);
}

/**
 * resySyncState
 * @description 为了解决hooks调用时序规则的问题，去除try catch的使用
 * 与valtio使用了相反的使用模式，valtio是在组件顶层使用自定义hook包裹组件
 * 使用useSnapshot进行驱动更新，而直接使用数据进行获取最新数据
 * 而这里我想着使用的简便化，就省略了驱动更新hook，而是使用了直接的数据解构
 * 相反的在需要获取同步最新数据的时候使用resySyncState进行获取
 */
export function resySyncState<T extends ResyType>(store: T): T {
  return store[getResySyncStateKey as keyof T] as T;
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
 * @param listener 监听订阅的回调函数
 * @param store 监听订阅的具体的某一个store容器
 * @param listenerKey 监听订阅的具体的某一个store容器的某一个字段数据变化，
 * 如果没有则默认监听store的任何一个数据的变化
 * @return Callback 返回取消监听的函数
 */
export function resyListener<T extends ResyType>(
  listener: ListenerHandle<T>,
  store: T,
  listenerKey?: keyof T,
): Callback {
  const resyListenerHandle = (): Callback => {
    const resyListenerEventType = (store[storeListenerKey as keyof T] as StoreListener).listenerEventType;
    
    const dispatchStoreEffectSetTemp = (store[storeListenerKey as keyof T] as StoreListener).dispatchStoreEffectSet;
    
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
    
    const customEventDispatcher: CustomEventInterface<T> = new (EventDispatcher as any)();
    customEventDispatcher.addEventListener(resyListenerEventType, listenerOrigin);
    dispatchStoreEffectSetTemp.add(customEventDispatcher);
    
    return () => {
      dispatchStoreEffectSetTemp.forEach(item => {
        if (item === customEventDispatcher) item.removeEventListener(resyListenerEventType)
      });
      dispatchStoreEffectSetTemp.delete(customEventDispatcher);
    };
  };
  return resyListenerHandle();
}
