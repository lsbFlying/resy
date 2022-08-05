import {
  Callback, ListenerHandle, CustomEventInterface, StoreHeartMapType,
  StoreHeartMapValueType, ResyUpdateType, State,
} from "./model";
import { storeHeartMapKey, useResyDriveKey } from "./static";
import { EventDispatcher } from "./listener";

/**
 * useResy
 * @description 驱动组件更新的hook，以use开头显然是要符合react的hook使用时序规则
 */
export function useResy<T extends State>(store: T): T {
  return store[useResyDriveKey as keyof T];
}

/**
 * resyListener
 * @description 监听订阅，类似subscribe/addEventListener，但是这里对应的数据的变化监听订阅
 * resyListener的存在是必要的，它的作用并不类比于useEffect，
 * 而是像subscribe或者addEventListener的效果，监听订阅数据的变化
 * 核心关键点在于它可以监听不同store的数据变化，具备多数据订阅监听的能力
 *
 * 本质上我是写了一个监听事件，而在resy里面的数据更新的情况下触发了这个监听的dispatch
 * 其实这里的监听订阅还可以使用proxy进行拦截监听，但是并没有使用这种方式
 * 因为resy产生的store数据存储本身就已经是proxy了，而proxy本身是有一定内存消耗的
 * 对性能而言有一定的考量因素，这里在resy已经使用了proxy拦截监听之后配合函数监听是更好的选择
 *
 * @param listener 监听订阅的回调函数
 * @param store 监听订阅的具体的某一个store容器
 * @param listenerKeys 监听订阅的具体的某一个store容器的某些字段数据变化，
 * 如果为空则默认监听store的任何一个数据的变化
 * @return Callback 返回取消监听的函数
 */
export function resyListener<T extends State>(
  listener: ListenerHandle<T>,
  store: T,
  listenerKeys?: (keyof T)[],
): Callback {
  const resyListenerEventType = (store[storeHeartMapKey as keyof T] as StoreHeartMapType<T>).get("listenerEventType") as StoreHeartMapValueType<T>["listenerEventType"];
  const dispatchStoreEffectSetTemp = (store[storeHeartMapKey as keyof T] as StoreHeartMapType<T>).get("dispatchStoreEffectSet") as StoreHeartMapValueType<T>["dispatchStoreEffectSet"];
  
  const listenerOrigin = (
    effectState: Partial<Omit<T, keyof ResyUpdateType<T>>>,
    prevState: Omit<T, keyof ResyUpdateType<T>>,
    nextState: Omit<T, keyof ResyUpdateType<T>>,
  ) => {
    let includesFlag = false;
    const listenerKeysIsEmpty = listenerKeys === undefined || !(listenerKeys && listenerKeys.length !== 0);
    if (!listenerKeysIsEmpty) {
      const effectStateFields = Object.keys(effectState);
      if (effectStateFields.some(key => listenerKeys.includes(key))) includesFlag = true;
    }
    if (listenerKeysIsEmpty || (!listenerKeysIsEmpty && includesFlag)) listener(effectState, prevState, nextState);
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
}
