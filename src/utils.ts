import {
  Callback, ResyStateType, ListenerHandle,
  CustomEventInterface, StoreListenerState, EffectState,
} from "./model";
import { storeListenerStateKey, useResyDriverKey } from "./static";
import { EventDispatcher } from "./listener";

/**
 * useResy
 * @description 驱动组件更新的hook，以use开头显然是要符合react的hook使用时序规则
 */
export function useResy<T extends ResyStateType>(store: T): T {
  return store[useResyDriverKey as keyof T];
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
export function resyListener<T extends ResyStateType>(
  listener: ListenerHandle<T>,
  store: T,
  listenerKey?: keyof T,
): Callback {
  const resyListenerEventType = (store[storeListenerStateKey as keyof T] as StoreListenerState<T>).listenerEventType;
  const dispatchStoreEffectSetTemp = (store[storeListenerStateKey as keyof T] as StoreListenerState<T>).dispatchStoreEffectSet;
  
  const listenerOrigin = (effectState: EffectState<T>, prevState: T, nextState: T) => {
    let includesFlag = true;
    if (listenerKey) {
      const effectStateFields = Object.keys(effectState);
      if (!effectStateFields.includes(listenerKey as string)) includesFlag = false;
    }
    if (!listenerKey || (listenerKey && includesFlag)) listener(effectState, prevState, nextState);
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
